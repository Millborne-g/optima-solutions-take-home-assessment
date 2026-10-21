import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/orderSyncService", () => ({
  retryFailedSync: vi.fn(),
  findByOrderId: vi.fn(),
}));

import {
  findByOrderId,
  retryFailedSync,
} from "@/server/services/orderSyncService";
import { POST } from "@/app/api/syncs/[orderId]/retry/route";

const baseSync = {
  id: "uuid-1",
  orderId: "ORD-10482",
  status: "success" as const,
  rawPayload: {},
  hubspotContactId: "c-1",
  hubspotDealId: "d-1",
  errorMessage: null,
  attemptCount: 2,
  lastAttemptedAt: "2026-09-20T06:32:00Z",
  createdAt: "2026-09-20T06:32:00Z",
  updatedAt: "2026-09-20T06:32:00Z",
};

describe("POST /api/syncs/[orderId]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when retry succeeds", async () => {
    vi.mocked(retryFailedSync).mockResolvedValue(baseSync);

    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ orderId: "ORD-10482" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderId).toBe("ORD-10482");
    expect(json.status).toBe("success");
    expect(retryFailedSync).toHaveBeenCalledWith("ORD-10482");
  });

  it("returns 404 when sync is not found", async () => {
    vi.mocked(retryFailedSync).mockResolvedValue(null);
    vi.mocked(findByOrderId).mockResolvedValue(null);

    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ orderId: "ORD-missing" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 409 when sync is not retryable", async () => {
    vi.mocked(retryFailedSync).mockResolvedValue(null);
    vi.mocked(findByOrderId).mockResolvedValue({
      ...baseSync,
      status: "success",
    });

    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ orderId: "ORD-10482" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("cannot be retried");
  });
});
