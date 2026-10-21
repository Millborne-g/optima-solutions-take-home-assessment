/**
 * Order webhook and sync domain types.
 */

export type OrderItem = {
  sku: string;
  name: string;
  qty: number;
  price: number;
};

export type OrderCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

/** Validated order.created webhook payload (camelCase after mapping). */
export type OrderPayload = {
  event: "order.created";
  orderId: string;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  currency: string;
  total: number;
};

export type SyncStatus = "pending" | "processing" | "success" | "failed";

/** Persisted order sync attempt. */
export type OrderSync = {
  id: string;
  orderId: string;
  status: SyncStatus;
  rawPayload: unknown;
  hubspotContactId: string | null;
  hubspotDealId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  lastAttemptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcessWebhookResult = {
  alreadySeen: boolean;
  sync: OrderSync | null;
};
