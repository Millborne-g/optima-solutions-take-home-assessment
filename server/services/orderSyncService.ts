import "server-only";
import type {
  OrderPayload,
  OrderSync,
  ProcessWebhookResult,
} from "@/entities/order/model/types";
import {
  orderPayloadSchema,
  toOrderPayload,
} from "@/entities/order/model/schema";
import {
  searchContactByEmail,
  createContact,
  updateContact,
} from "@/server/hubspot/contactsApi";
import {
  createDeal,
  searchDealByName,
  dealNameForOrder,
} from "@/server/hubspot/dealsApi";
import { withRetry } from "@/server/lib/retry";
import {
  insertOrIgnore,
  findByOrderId,
  markProcessing,
  updateSync,
  listRecentPage,
  countByStatus,
  type SyncStatusCounts,
} from "@/server/supabase/orderSyncsRepository";

/**
 * Close date for HubSpot: date portion of created_at as YYYY-MM-DD (UTC).
 */
function closeDateFromCreatedAt(createdAt: string): string {
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Avoid leaking tokens; keep message short for the dashboard.
    return err.message.slice(0, 500);
  }
  return "Unknown sync error";
}

function payloadFromStoredRaw(
  rawPayload: unknown,
  fallback: OrderPayload,
): OrderPayload {
  const parseResult = orderPayloadSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    return fallback;
  }
  return toOrderPayload(parseResult.data);
}

/**
 * Upsert HubSpot contact by email. Returns HubSpot contact ID.
 */
async function upsertContactForOrder(payload: OrderPayload): Promise<string> {
  const email = payload.customer.email;
  const existing = await withRetry(() => searchContactByEmail(email));

  if (existing) {
    const updated = await withRetry(() =>
      updateContact(existing.id, {
        firstName: payload.customer.firstName,
        lastName: payload.customer.lastName,
        phone: payload.customer.phone,
      }),
    );
    return updated.id;
  }

  const created = await withRetry(() =>
    createContact({
      email,
      firstName: payload.customer.firstName,
      lastName: payload.customer.lastName,
      phone: payload.customer.phone,
    }),
  );
  return created.id;
}

/**
 * Ensure a Deal exists for this order. Recovers from partial failure by
 * searching for an existing deal named "Order {orderId}" before creating,
 * and again if create appears to fail after HubSpot may have written the Deal.
 */
async function ensureDealForOrder(
  payload: OrderPayload,
  contactId: string,
  existingDealId: string | null,
): Promise<string> {
  if (existingDealId) {
    return existingDealId;
  }

  const name = dealNameForOrder(payload.orderId);
  const found = await withRetry(() => searchDealByName(name));
  if (found) {
    return found.id;
  }

  try {
    const deal = await withRetry(() =>
      createDeal({
        orderId: payload.orderId,
        amount: payload.total,
        closeDateIso: closeDateFromCreatedAt(payload.createdAt),
        contactId,
      }),
    );
    return deal.id;
  } catch (err) {
    const recovered = await withRetry(() => searchDealByName(name));
    if (recovered) {
      return recovered.id;
    }
    throw err;
  }
}

/**
 * Run the HubSpot sync for an already-claimed order_syncs row.
 */
async function runSyncForRecord(
  orderId: string,
  payload: OrderPayload,
  existing: OrderSync,
): Promise<OrderSync> {
  try {
    let contactId = existing.hubspotContactId;
    if (!contactId) {
      contactId = await upsertContactForOrder(payload);
      await updateSync(orderId, { hubspotContactId: contactId });
    }

    const dealId = await ensureDealForOrder(
      payload,
      contactId,
      existing.hubspotDealId,
    );
    await updateSync(orderId, {
      hubspotDealId: dealId,
      status: "success",
      errorMessage: null,
    });

    const final = await findByOrderId(orderId);
    return final ?? existing;
  } catch (err) {
    const message = sanitizeError(err);
    console.error("[OrderSync] Failed for", orderId, message);
    try {
      await updateSync(orderId, {
        status: "failed",
        errorMessage: message,
      });
    } catch (persistErr) {
      console.error(
        "[OrderSync] Failed to persist failure status for",
        orderId,
        persistErr,
      );
      throw persistErr;
    }
    const final = await findByOrderId(orderId);
    return final ?? existing;
  }
}

/**
 * Process an inbound order.created webhook after signature + schema validation.
 */
export async function processWebhook(
  payload: OrderPayload,
  rawPayload: unknown,
): Promise<ProcessWebhookResult> {
  const inserted = await insertOrIgnore(payload.orderId, rawPayload);

  if (!inserted) {
    const existing = await findByOrderId(payload.orderId);
    if (!existing) {
      return { alreadySeen: true, sync: null };
    }

    if (existing.status === "success") {
      return { alreadySeen: true, sync: existing };
    }

    if (existing.status === "failed" || existing.status === "processing") {
      const processing = await markProcessing(payload.orderId, {
        onlyIfRetryable: true,
      });
      if (!processing) {
        const current = await findByOrderId(payload.orderId);
        return { alreadySeen: true, sync: current };
      }

      const resumePayload = payloadFromStoredRaw(
        processing.rawPayload,
        payload,
      );
      const sync = await runSyncForRecord(
        payload.orderId,
        resumePayload,
        processing,
      );
      return { alreadySeen: false, sync };
    }

    return { alreadySeen: true, sync: existing };
  }

  const processing = await markProcessing(payload.orderId);
  if (!processing) {
    const existing = await findByOrderId(payload.orderId);
    return { alreadySeen: false, sync: existing };
  }

  const sync = await runSyncForRecord(payload.orderId, payload, processing);
  return { alreadySeen: false, sync };
}

/**
 * Retry a failed or stuck-processing sync.
 * Returns null when the order is not in a retryable state.
 */
export async function retryFailedSync(orderId: string): Promise<OrderSync | null> {
  const processing = await markProcessing(orderId, { onlyIfRetryable: true });
  if (!processing) {
    return null;
  }

  const parseResult = orderPayloadSchema.safeParse(processing.rawPayload);
  if (!parseResult.success) {
    await updateSync(orderId, {
      status: "failed",
      errorMessage: "Stored payload is invalid; cannot retry",
    });
    return findByOrderId(orderId);
  }

  const payload = toOrderPayload(parseResult.data);
  return runSyncForRecord(orderId, payload, processing);
}

export async function listRecentSyncsPage(
  offset = 0,
  limit = 5,
  orderIdQuery?: string,
): Promise<{ syncs: OrderSync[]; hasMore: boolean; total: number }> {
  return listRecentPage(offset, limit, orderIdQuery);
}

export async function getSyncStatusCounts(): Promise<SyncStatusCounts> {
  return countByStatus();
}

export type { SyncStatusCounts };
export { findByOrderId };
