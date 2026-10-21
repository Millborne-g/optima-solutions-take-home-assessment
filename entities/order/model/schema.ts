import { z } from "zod";
import type { OrderPayload } from "./types";

/**
 * Zod schemas for the order.created webhook payload (snake_case wire format).
 */

export const orderItemSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Item name is required"),
  qty: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().nonnegative("Price must be non-negative"),
});

export const orderPayloadSchema = z.object({
  event: z.literal("order.created"),
  order_id: z.string().trim().min(1, "order_id is required"),
  created_at: z
    .string()
    .min(1, "created_at is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "created_at must be a valid date-time",
    }),
  customer: z.object({
    email: z.string().trim().email("A valid customer email is required"),
    first_name: z.string().trim().min(1, "first_name is required"),
    last_name: z.string().trim().min(1, "last_name is required"),
    phone: z.string().trim().optional(),
  }),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  currency: z.string().trim().length(3, "currency must be a 3-letter code"),
  total: z.number().nonnegative("total must be non-negative"),
});

export type OrderPayloadWire = z.infer<typeof orderPayloadSchema>;

/** Map validated wire payload to camelCase domain type. */
export function toOrderPayload(wire: OrderPayloadWire): OrderPayload {
  return {
    event: wire.event,
    orderId: wire.order_id,
    createdAt: wire.created_at,
    customer: {
      email: wire.customer.email.toLowerCase(),
      firstName: wire.customer.first_name,
      lastName: wire.customer.last_name,
      phone: wire.customer.phone,
    },
    items: wire.items.map((item) => ({
      sku: item.sku,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    currency: wire.currency.toUpperCase(),
    total: wire.total,
  };
}
