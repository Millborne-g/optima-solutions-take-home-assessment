import {
  getSyncStatusCounts,
  listRecentSyncsPage,
} from "@/server/services/orderSyncService";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  offsetToPage,
  pageToOffset,
  parsePageParam,
} from "@/shared/lib/tablePagination";
import { handleServiceError, ok } from "@/shared/lib/apiResponse";

/**
 * GET /api/syncs
 *
 * Paginated recent order sync attempts.
 * Query: page (1-based), q (order_id substring), limit (1–50, default 5).
 * Legacy: after (0-based offset) maps to page when page is absent.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const pageRaw = searchParams.get("page");
    const afterRaw = searchParams.get("after");
    const limitRaw = searchParams.get("limit");
    const q = searchParams.get("q")?.trim() ?? "";

    const parsedLimit = limitRaw != null ? Number.parseInt(limitRaw, 10) : DEFAULT_TABLE_PAGE_SIZE;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(50, parsedLimit)
        : DEFAULT_TABLE_PAGE_SIZE;

    let page = parsePageParam(pageRaw ?? undefined);
    if ((pageRaw == null || pageRaw === "") && afterRaw != null && afterRaw !== "") {
      const parsedOffset = Number.parseInt(afterRaw, 10);
      if (Number.isFinite(parsedOffset) && parsedOffset >= 0) {
        page = offsetToPage(parsedOffset, limit);
      }
    }

    const offset = pageToOffset(page, limit);

    const [{ syncs, hasMore, total }, counts] = await Promise.all([
      listRecentSyncsPage(offset, limit, q || undefined),
      getSyncStatusCounts(),
    ]);

    const nextPage = hasMore ? page + 1 : null;
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
      page,
      nextPage,
      nextCursor: nextPage != null ? String(pageToOffset(nextPage, limit)) : null,
      total,
      counts,
    });
  } catch (err) {
    return handleServiceError(err);
  }
}
