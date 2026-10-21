import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeWebhookSignature } from "@/server/webhook/verify";

vi.mock("@/server/services/orderSyncService", () => ({
  processWebhook: vi.fn(),
}));

import { processWebhook } from "@/server/services/orderSyncService";
import { POST } from "@/app/api/webhooks/order/route";

const SECRET = "test-webhook-route-secret";

const validPayload = {
  event: "order.created",
  order_id: "ORD-10482",
  created_at: "2026-09-20T14:32:00+08:00",
  customer: {
    email: "maria.santos@example.com",
    first_name: "Maria",
    last_name: "Santos",
    phone: "+639171234567",
  },
  items: [
    { sku: "TSH-BLK-M", name: "Black Tee (M)", qty: 2, price: 450.0 },
  ],
  currency: "PHP",
  total: 900.0,
};

function signedRequest(
  body: string,
  signature: string | null,
): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (signature !== null) {
    headers.set("x-webhook-signature", signature);
  }
  return new Request("http://localhost/api/webhooks/order", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhooks/order", () => {
  const previousSecret = process.env.WEBHOOK_SIGNING_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEBHOOK_SIGNING_SECRET = SECRET;
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.WEBHOOK_SIGNING_SECRET;
    } else {
      process.env.WEBHOOK_SIGNING_SECRET = previousSecret;
    }
  });

  it("returns 401 when signature header is missing", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(signedRequest(body, null));
    expect(res.status).toBe(401);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 401 when signature is invalid", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(signedRequest(body, "deadbeef"));
    expect(res.status).toBe(401);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON with a valid signature", async () => {
    const body = "{not-json";
    const sig = computeWebhookSignature(body, SECRET);
    const res = await POST(signedRequest(body, sig));
    expect(res.status).toBe(400);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 400 for schema validation failure", async () => {
    const body = JSON.stringify({ ...validPayload, total: -1 });
    const sig = computeWebhookSignature(body, SECRET);
    const res = await POST(signedRequest(body, sig));
    expect(res.status).toBe(400);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 500 when signing secret is missing", async () => {
    delete process.env.WEBHOOK_SIGNING_SECRET;
    const body = JSON.stringify(validPayload);
    const sig = computeWebhookSignature(body, SECRET);
    const res = await POST(signedRequest(body, sig));
    expect(res.status).toBe(500);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 200 and calls processWebhook for a valid request", async () => {
    vi.mocked(processWebhook).mockResolvedValue({
      alreadySeen: false,
      sync: {
        id: "uuid-1",
        orderId: "ORD-10482",
        status: "success",
        rawPayload: validPayload,
        hubspotContactId: "c-1",
        hubspotDealId: "d-1",
        errorMessage: null,
        attemptCount: 1,
        lastAttemptedAt: "2026-09-20T06:32:00Z",
        createdAt: "2026-09-20T06:32:00Z",
        updatedAt: "2026-09-20T06:32:00Z",
      },
    });

    const body = JSON.stringify(validPayload);
    const sig = computeWebhookSignature(body, SECRET);
    const res = await POST(signedRequest(body, sig));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(processWebhook).toHaveBeenCalledOnce();
    expect(json.orderId).toBe("ORD-10482");
    expect(json.alreadySeen).toBe(false);
  });
});
