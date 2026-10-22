import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { OrderPayload } from "@/entities/order/model/types";
import { HubSpotRateLimitError, HubSpotApiError } from "@/server/hubspot/contactsApi";

vi.mock("@/server/hubspot/contactsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/hubspot/contactsApi")>();
  return {
    ...actual,
    searchContactByEmail: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
  };
});

vi.mock("@/server/hubspot/dealsApi", () => ({
  createDeal: vi.fn(),
  searchDealByName: vi.fn(),
  dealNameForOrder: (id: string) => `Order ${id}`,
}));

vi.mock("@/server/supabase/orderSyncsRepository", () => ({
  insertOrIgnore: vi.fn(),
  findByOrderId: vi.fn(),
  markProcessing: vi.fn(),
  updateSync: vi.fn(),
  listRecentPage: vi.fn(),
  countByStatus: vi.fn(),
}));

vi.mock("@/server/lib/retry", () => ({
  withRetry: async <T>(fn: () => Promise<T>) => fn(),
}));

import {
  searchContactByEmail,
  createContact,
  updateContact,
} from "@/server/hubspot/contactsApi";
import { createDeal, searchDealByName } from "@/server/hubspot/dealsApi";
import {
  insertOrIgnore,
  findByOrderId,
  markProcessing,
  updateSync,
} from "@/server/supabase/orderSyncsRepository";
import {
  processWebhook,
  retryFailedSync,
} from "@/server/services/orderSyncService";

const payload: OrderPayload = {
  event: "order.created",
  orderId: "ORD-10482",
  createdAt: "2026-09-20T14:32:00+08:00",
  customer: {
    email: "maria.santos@example.com",
    firstName: "Maria",
    lastName: "Santos",
    phone: "+639171234567",
  },
  items: [{ sku: "TSH-BLK-M", name: "Black Tee (M)", qty: 2, price: 450 }],
  currency: "PHP",
  total: 900,
};

const baseSync = {
  id: "uuid-1",
  orderId: "ORD-10482",
  status: "pending" as const,
  rawPayload: {},
  hubspotContactId: null,
  hubspotDealId: null,
  errorMessage: null,
  attemptCount: 0,
  lastAttemptedAt: null,
  createdAt: "2026-09-20T06:32:00Z",
  updatedAt: "2026-09-20T06:32:00Z",
};

describe("processWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates contact and deal on first delivery", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      attemptCount: 1,
    });
    (searchContactByEmail as Mock).mockResolvedValue(null);
    (createContact as Mock).mockResolvedValue({
      id: "c-1",
      email: payload.customer.email,
      firstName: "Maria",
      lastName: "Santos",
      phone: null,
      createdAt: null,
      updatedAt: null,
    });
    (searchDealByName as Mock).mockResolvedValue(null);
    (createDeal as Mock).mockResolvedValue({
      id: "d-1",
      name: "Order ORD-10482",
      amount: "900",
      closeDate: "2026-09-20",
      pipeline: "default",
      stage: "appointmentscheduled",
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-1",
      attemptCount: 1,
    });

    const result = await processWebhook(payload, { order_id: "ORD-10482" });

    expect(result.alreadySeen).toBe(false);
    expect(createContact).toHaveBeenCalledOnce();
    expect(createDeal).toHaveBeenCalledOnce();
    expect(result.sync?.status).toBe("success");
  });

  it("returns alreadySeen without HubSpot calls on successful duplicate", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-1",
    });

    const result = await processWebhook(payload, {});

    expect(result.alreadySeen).toBe(true);
    expect(createContact).not.toHaveBeenCalled();
    expect(createDeal).not.toHaveBeenCalled();
    expect(markProcessing).not.toHaveBeenCalled();
  });

  it("resumes sync when redelivered order is failed", async () => {
    const wire = {
      event: "order.created",
      order_id: "ORD-10482",
      created_at: "2026-09-20T14:32:00+08:00",
      customer: {
        email: "maria.santos@example.com",
        first_name: "Maria",
        last_name: "Santos",
      },
      items: [{ sku: "X", name: "Y", qty: 1, price: 10 }],
      currency: "PHP",
      total: 10,
    };

    (insertOrIgnore as Mock).mockResolvedValue(null);
    (findByOrderId as Mock)
      .mockResolvedValueOnce({
        ...baseSync,
        status: "failed",
        rawPayload: wire,
        hubspotContactId: "c-1",
        errorMessage: "previous",
      })
      .mockResolvedValue({
        ...baseSync,
        status: "success",
        hubspotContactId: "c-1",
        hubspotDealId: "d-resume",
      });
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      rawPayload: wire,
      hubspotContactId: "c-1",
      attemptCount: 2,
    });
    (searchDealByName as Mock).mockResolvedValue(null);
    (createDeal as Mock).mockResolvedValue({
      id: "d-resume",
      name: "Order ORD-10482",
      amount: "10",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);

    const result = await processWebhook(payload, {});

    expect(result.alreadySeen).toBe(false);
    expect(markProcessing).toHaveBeenCalledWith("ORD-10482", {
      onlyIfRetryable: true,
    });
    expect(createDeal).toHaveBeenCalledOnce();
    expect(result.sync?.status).toBe("success");
  });

  it("resumes sync when redelivered order is stuck processing", async () => {
    const wire = {
      event: "order.created",
      order_id: "ORD-10482",
      created_at: "2026-09-20T14:32:00+08:00",
      customer: {
        email: "maria.santos@example.com",
        first_name: "Maria",
        last_name: "Santos",
      },
      items: [{ sku: "X", name: "Y", qty: 1, price: 10 }],
      currency: "PHP",
      total: 10,
    };

    (insertOrIgnore as Mock).mockResolvedValue(null);
    (findByOrderId as Mock)
      .mockResolvedValueOnce({
        ...baseSync,
        status: "processing",
        rawPayload: wire,
        hubspotContactId: "c-1",
      })
      .mockResolvedValue({
        ...baseSync,
        status: "success",
        hubspotContactId: "c-1",
        hubspotDealId: "d-stuck",
      });
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      rawPayload: wire,
      hubspotContactId: "c-1",
      attemptCount: 2,
    });
    (searchDealByName as Mock).mockResolvedValue({
      id: "d-stuck",
      name: "Order ORD-10482",
      amount: "10",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);

    const result = await processWebhook(payload, {});

    expect(result.alreadySeen).toBe(false);
    expect(markProcessing).toHaveBeenCalledWith("ORD-10482", {
      onlyIfRetryable: true,
    });
    expect(createDeal).not.toHaveBeenCalled();
    expect(result.sync?.status).toBe("success");
  });

  it("skips contact create when contact id already stored", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      hubspotContactId: "c-existing",
      attemptCount: 1,
    });
    (searchDealByName as Mock).mockResolvedValue(null);
    (createDeal as Mock).mockResolvedValue({
      id: "d-1",
      name: "Order ORD-10482",
      amount: "900",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-existing",
      hubspotDealId: "d-1",
    });

    await processWebhook(payload, {});

    expect(searchContactByEmail).not.toHaveBeenCalled();
    expect(createContact).not.toHaveBeenCalled();
    expect(createDeal).toHaveBeenCalledOnce();
  });

  it("reuses existing deal found by name on partial failure recovery", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      hubspotContactId: "c-1",
      attemptCount: 2,
    });
    (searchDealByName as Mock).mockResolvedValue({
      id: "d-existing",
      name: "Order ORD-10482",
      amount: "900",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-existing",
    });

    await processWebhook(payload, {});

    expect(createDeal).not.toHaveBeenCalled();
    expect(searchDealByName).toHaveBeenCalledOnce();
  });

  it("marks failed when HubSpot permanent 4xx occurs", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      attemptCount: 1,
    });
    (searchContactByEmail as Mock).mockRejectedValue(
      new HubSpotApiError("Bad request", 400),
    );
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "failed",
      errorMessage: "Bad request",
      attemptCount: 1,
    });

    const result = await processWebhook(payload, {});

    expect(result.sync?.status).toBe("failed");
    expect(updateSync).toHaveBeenCalledWith(
      "ORD-10482",
      expect.objectContaining({ status: "failed" }),
    );
  });

  it("marks failed when rate limit surfaces (retry mocked as passthrough)", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      attemptCount: 1,
    });
    (searchContactByEmail as Mock).mockRejectedValue(
      new HubSpotRateLimitError(1000),
    );
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "failed",
      attemptCount: 1,
    });

    const result = await processWebhook(payload, {});
    expect(result.sync?.status).toBe("failed");
  });

  it("recovers deal id when create fails after HubSpot may have written", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      hubspotContactId: "c-1",
      attemptCount: 1,
    });
    (searchDealByName as Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "d-recovered",
        name: "Order ORD-10482",
        amount: "900",
        closeDate: null,
        pipeline: null,
        stage: null,
        createdAt: null,
      });
    (createDeal as Mock).mockRejectedValue(new Error("network blip"));
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-recovered",
    });

    const result = await processWebhook(payload, {});

    expect(result.sync?.status).toBe("success");
    expect(createDeal).toHaveBeenCalledOnce();
    expect(searchDealByName).toHaveBeenCalledTimes(2);
    expect(updateSync).toHaveBeenCalledWith(
      "ORD-10482",
      expect.objectContaining({
        hubspotDealId: "d-recovered",
        status: "success",
      }),
    );
  });

  it("rethrows when persisting failure status also fails", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      attemptCount: 1,
    });
    (searchContactByEmail as Mock).mockRejectedValue(
      new HubSpotApiError("Bad request", 400),
    );
    (updateSync as Mock).mockRejectedValue(
      new Error("Failed to update order sync: db down"),
    );

    await expect(processWebhook(payload, {})).rejects.toThrow(
      "Failed to update order sync: db down",
    );
  });

  it("updates existing contact when email already exists", async () => {
    (insertOrIgnore as Mock).mockResolvedValue(baseSync);
    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      attemptCount: 1,
    });
    (searchContactByEmail as Mock).mockResolvedValue({
      id: "c-old",
      email: payload.customer.email,
      firstName: "Old",
      lastName: "Name",
      phone: null,
      createdAt: null,
      updatedAt: null,
    });
    (updateContact as Mock).mockResolvedValue({
      id: "c-old",
      email: payload.customer.email,
      firstName: "Maria",
      lastName: "Santos",
      phone: payload.customer.phone ?? null,
      createdAt: null,
      updatedAt: null,
    });
    (searchDealByName as Mock).mockResolvedValue(null);
    (createDeal as Mock).mockResolvedValue({
      id: "d-1",
      name: "Order ORD-10482",
      amount: "900",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-old",
      hubspotDealId: "d-1",
    });

    await processWebhook(payload, {});

    expect(updateContact).toHaveBeenCalledOnce();
    expect(createContact).not.toHaveBeenCalled();
  });
});

describe("retryFailedSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when sync is not retryable", async () => {
    (markProcessing as Mock).mockResolvedValue(null);
    const result = await retryFailedSync("ORD-10482");
    expect(result).toBeNull();
    expect(markProcessing).toHaveBeenCalledWith("ORD-10482", {
      onlyIfRetryable: true,
    });
  });

  it("retries from stored raw payload when failed", async () => {
    const wire = {
      event: "order.created",
      order_id: "ORD-10482",
      created_at: "2026-09-20T14:32:00+08:00",
      customer: {
        email: "maria.santos@example.com",
        first_name: "Maria",
        last_name: "Santos",
      },
      items: [{ sku: "X", name: "Y", qty: 1, price: 10 }],
      currency: "PHP",
      total: 10,
    };

    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      rawPayload: wire,
      hubspotContactId: "c-1",
      attemptCount: 2,
    });
    (searchDealByName as Mock).mockResolvedValue(null);
    (createDeal as Mock).mockResolvedValue({
      id: "d-2",
      name: "Order ORD-10482",
      amount: "10",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-2",
      attemptCount: 2,
    });

    const result = await retryFailedSync("ORD-10482");
    expect(result?.status).toBe("success");
    expect(createDeal).toHaveBeenCalledOnce();
    expect(markProcessing).toHaveBeenCalledWith("ORD-10482", {
      onlyIfRetryable: true,
    });
  });

  it("retries from stored raw payload when stuck processing", async () => {
    const wire = {
      event: "order.created",
      order_id: "ORD-10482",
      created_at: "2026-09-20T14:32:00+08:00",
      customer: {
        email: "maria.santos@example.com",
        first_name: "Maria",
        last_name: "Santos",
      },
      items: [{ sku: "X", name: "Y", qty: 1, price: 10 }],
      currency: "PHP",
      total: 10,
    };

    (markProcessing as Mock).mockResolvedValue({
      ...baseSync,
      status: "processing",
      rawPayload: wire,
      hubspotContactId: "c-1",
      attemptCount: 3,
    });
    (searchDealByName as Mock).mockResolvedValue({
      id: "d-existing",
      name: "Order ORD-10482",
      amount: "10",
      closeDate: null,
      pipeline: null,
      stage: null,
      createdAt: null,
    });
    (updateSync as Mock).mockResolvedValue(null);
    (findByOrderId as Mock).mockResolvedValue({
      ...baseSync,
      status: "success",
      hubspotContactId: "c-1",
      hubspotDealId: "d-existing",
      attemptCount: 3,
    });

    const result = await retryFailedSync("ORD-10482");
    expect(result?.status).toBe("success");
    expect(createDeal).not.toHaveBeenCalled();
  });
});
