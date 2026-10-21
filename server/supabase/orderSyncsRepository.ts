import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderSync, SyncStatus } from "@/entities/order/model/types";
import { getSupabaseServiceClient } from "./client";

type OrderSyncRow = {
  id: string;
  order_id: string;
  status: string;
  raw_payload: unknown;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  error_message: string | null;
  attempt_count: number;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToSync(row: OrderSyncRow): OrderSync {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status as SyncStatus,
    rawPayload: row.raw_payload,
    hubspotContactId: row.hubspot_contact_id,
    hubspotDealId: row.hubspot_deal_id,
    errorMessage: row.error_message,
    attemptCount: row.attempt_count,
    lastAttemptedAt: row.last_attempted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function client(): SupabaseClient {
  return getSupabaseServiceClient() as unknown as SupabaseClient;
}

/**
 * Insert a new sync record. Returns the row when inserted, or null when
 * order_id already exists (unique constraint conflict).
 */
export async function insertOrIgnore(
  orderId: string,
  rawPayload: unknown,
): Promise<OrderSync | null> {
  const { data, error } = await client()
    .from("order_syncs")
    .insert({
      order_id: orderId,
      status: "pending",
      raw_payload: rawPayload,
      attempt_count: 0,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    console.error("[Supabase] insertOrIgnore error:", {
      code: error.code,
      message: error.message,
      order_id: orderId,
    });
    throw new Error(`Failed to insert order sync: ${error.message}`);
  }

  if (!data) return null;
  return rowToSync(data as OrderSyncRow);
}

export async function findByOrderId(orderId: string): Promise<OrderSync | null> {
  const { data, error } = await client()
    .from("order_syncs")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] findByOrderId error:", {
      code: error.code,
      message: error.message,
      order_id: orderId,
    });
    return null;
  }
  if (!data) return null;
  return rowToSync(data as OrderSyncRow);
}

/**
 * Mark a sync as processing and increment attempt_count.
 * When onlyIfRetryable is true, only transitions from status='failed'
 * or status='processing' (prevents concurrent retries on success/pending).
 */
export async function markProcessing(
  orderId: string,
  options: { onlyIfRetryable?: boolean } = {},
): Promise<OrderSync | null> {
  const existing = await findByOrderId(orderId);
  if (!existing) return null;
  if (
    options.onlyIfRetryable &&
    existing.status !== "failed" &&
    existing.status !== "processing"
  ) {
    return null;
  }

  const now = new Date().toISOString();
  let query = client()
    .from("order_syncs")
    .update({
      status: "processing",
      last_attempted_at: now,
      updated_at: now,
      error_message: null,
      attempt_count: existing.attemptCount + 1,
    })
    .eq("order_id", orderId);

  if (options.onlyIfRetryable) {
    query = query.in("status", ["failed", "processing"]);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    console.error("[Supabase] markProcessing error:", error.message);
    return null;
  }
  if (!data) return null;
  return rowToSync(data as OrderSyncRow);
}

export async function updateSync(
  orderId: string,
  patch: {
    status?: SyncStatus;
    hubspotContactId?: string | null;
    hubspotDealId?: string | null;
    errorMessage?: string | null;
  },
): Promise<OrderSync | null> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.hubspotContactId !== undefined) {
    update.hubspot_contact_id = patch.hubspotContactId;
  }
  if (patch.hubspotDealId !== undefined) {
    update.hubspot_deal_id = patch.hubspotDealId;
  }
  if (patch.errorMessage !== undefined) {
    update.error_message = patch.errorMessage;
  }

  const { data, error } = await client()
    .from("order_syncs")
    .update(update)
    .eq("order_id", orderId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Supabase] updateSync error:", {
      code: error.code,
      message: error.message,
      order_id: orderId,
    });
    throw new Error(`Failed to update order sync: ${error.message}`);
  }
  if (!data) return null;
  return rowToSync(data as OrderSyncRow);
}

export async function listRecent(limit = 50): Promise<OrderSync[]> {
  const { data, error } = await client()
    .from("order_syncs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] listRecent error:", error.message);
    throw new Error(`Failed to list order syncs: ${error.message}`);
  }

  return ((data ?? []) as OrderSyncRow[]).map(rowToSync);
}
