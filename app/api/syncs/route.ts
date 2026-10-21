import { listRecentSyncs } from "@/server/services/orderSyncService";
import { handleServiceError, ok } from "@/shared/lib/apiResponse";

/**
 * GET /api/syncs
 *
 * Returns the 50 most recent order sync attempts.
 */
export async function GET(): Promise<Response> {
  try {
    const syncs = await listRecentSyncs(50);
    return ok({
      syncs: syncs.map((s) => ({
        orderId: s.orderId,
        status: s.status,
        hubspotContactId: s.hubspotContactId,
        hubspotDealId: s.hubspotDealId,
        errorMessage: s.errorMessage,
        attemptCount: s.attemptCount,
        lastAttemptedAt: s.lastAttemptedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    return handleServiceError(err);
  }
}
