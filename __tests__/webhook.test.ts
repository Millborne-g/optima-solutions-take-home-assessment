import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import {
  computeWebhookSignature,
  verifyWebhookSignature,
} from "@/server/webhook/verify";
import {
  orderPayloadSchema,
  toOrderPayload,
} from "@/entities/order/model/schema";

const SECRET = "test-webhook-secret";

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

describe("verifyWebhookSignature", () => {
  it("returns true for a correct signature", () => {
    const body = JSON.stringify(validPayload);
    const sig = computeWebhookSignature(body, SECRET);
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const body = JSON.stringify(validPayload);
    const sig = computeWebhookSignature(body, SECRET);
    expect(verifyWebhookSignature(body + " ", sig, SECRET)).toBe(false);
  });

  it("returns false for a wrong signature", () => {
    const body = JSON.stringify(validPayload);
    const wrong = createHmac("sha256", "other").update(body).digest("hex");
    expect(verifyWebhookSignature(body, wrong, SECRET)).toBe(false);
  });

  it("returns false for empty signature", () => {
    expect(verifyWebhookSignature("{}", "", SECRET)).toBe(false);
  });
});

describe("orderPayloadSchema", () => {
  it("accepts the assessment sample payload", () => {
    const result = orderPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      const mapped = toOrderPayload(result.data);
      expect(mapped.orderId).toBe("ORD-10482");
      expect(mapped.customer.email).toBe("maria.santos@example.com");
      expect(mapped.total).toBe(900);
    }
  });

  it("rejects missing email", () => {
    const bad = {
      ...validPayload,
      customer: { ...validPayload.customer, email: undefined },
    };
    expect(orderPayloadSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects invalid email", () => {
    const bad = {
      ...validPayload,
      customer: { ...validPayload.customer, email: "not-an-email" },
    };
    expect(orderPayloadSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects negative total", () => {
    expect(
      orderPayloadSchema.safeParse({ ...validPayload, total: -1 }).success,
    ).toBe(false);
  });

  it("rejects empty items", () => {
    expect(
      orderPayloadSchema.safeParse({ ...validPayload, items: [] }).success,
    ).toBe(false);
  });

  it("rejects wrong event type", () => {
    expect(
      orderPayloadSchema.safeParse({ ...validPayload, event: "order.updated" })
        .success,
    ).toBe(false);
  });

  it("rejects missing order_id", () => {
    const rest = { ...validPayload };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (rest as any).order_id;
    expect(orderPayloadSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid created_at", () => {
    expect(
      orderPayloadSchema.safeParse({
        ...validPayload,
        created_at: "not-a-date",
      }).success,
    ).toBe(false);
  });
});
