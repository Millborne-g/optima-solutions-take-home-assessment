import {
  orderPayloadSchema,
  toOrderPayload,
} from "@/entities/order/model/schema";
import { processWebhook } from "@/server/services/orderSyncService";
import {
  WEBHOOK_SIGNATURE_HEADER,
  getWebhookSigningSecret,
  verifyWebhookSignature,
} from "@/server/webhook/verify";
import { badRequest, ok } from "@/shared/lib/apiResponse";

/**
 * POST /api/webhooks/order
 *
 * Accepts order.created webhooks, verifies HMAC-SHA256 signature,
 * validates the payload, and syncs Contact + Deal to HubSpot.
 *
 * Returns 200 for accepted (including duplicates) so senders do not
 * endlessly retry. Failures are recorded in order_syncs for dashboard retry.
 */
export async function POST(request: Request): Promise<Response> {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return badRequest("Unable to read request body");
  }

  const signature = request.headers.get(WEBHOOK_SIGNATURE_HEADER);
  if (!signature) {
    return Response.json(
      { error: "Missing signature header", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let secret: string;
  try {
    secret = getWebhookSigningSecret();
  } catch (err) {
    console.error("[Webhook] Missing signing secret:", err);
    return Response.json(
      { error: "Webhook signing is not configured", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return Response.json(
      { error: "Invalid signature", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parseResult = orderPayloadSchema.safeParse(json);
  if (!parseResult.success) {
    const first = parseResult.error.issues[0];
    return badRequest(first?.message ?? "Validation failed");
  }

  const payload = toOrderPayload(parseResult.data);

  try {
    const result = await processWebhook(payload, json);

    if (result.alreadySeen) {
      return ok({
        message: "Duplicate order_id; already processed",
        alreadySeen: true,
        orderId: payload.orderId,
        status: result.sync?.status ?? "unknown",
      });
    }

    return ok({
      message: "Order accepted",
      alreadySeen: false,
      orderId: payload.orderId,
      status: result.sync?.status ?? "unknown",
      hubspotContactId: result.sync?.hubspotContactId ?? null,
      hubspotDealId: result.sync?.hubspotDealId ?? null,
    });
  } catch (err) {
    console.error("[Webhook] Unhandled processing error:", err);
    return Response.json(
      { error: "Failed to process webhook", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
