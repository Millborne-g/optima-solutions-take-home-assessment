import { retryFailedSync } from "@/server/services/orderSyncService";
import {
  conflict,
  badRequest,
  handleServiceError,
  notFound,
  ok,
} from "@/shared/lib/apiResponse";

/**
 * POST /api/syncs/[orderId]/retry
 *
 * Retries a failed or stuck-processing sync. Returns 409 if the sync is
 * not retryable (e.g. success / pending), preventing unsafe concurrent work.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  const { orderId } = await params;

  if (!orderId || typeof orderId !== "string") {
    return badRequest("orderId is required");
  }

  try {
    const sync = await retryFailedSync(orderId);

    if (!sync) {
      // Either not found or not retryable — distinguish via find
      const { findByOrderId } = await import(
        "@/server/services/orderSyncService"
      );
      const existing = await findByOrderId(orderId);
      if (!existing) {
        return notFound(`Sync for order ${orderId} not found`);
      }
      return conflict(
        `Sync is in '${existing.status}' state and cannot be retried (only failed or processing)`,
      );
    }

    return ok({
      orderId: sync.orderId,
      status: sync.status,
      hubspotContactId: sync.hubspotContactId,
      hubspotDealId: sync.hubspotDealId,
      errorMessage: sync.errorMessage,
      attemptCount: sync.attemptCount,
      lastAttemptedAt: sync.lastAttemptedAt,
      createdAt: sync.createdAt,
      updatedAt: sync.updatedAt,
    });
  } catch (err) {
    return handleServiceError(err);
  }
}
