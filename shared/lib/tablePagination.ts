/** Default page size for dashboard tables (Prev / Next). */
export const DEFAULT_TABLE_PAGE_SIZE = 5;

/**
 * Parse a 1-based page query param. Invalid / missing → 1.
 */
export function parsePageParam(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 1;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/** Convert 1-based page to 0-based row offset. */
export function pageToOffset(
  page: number,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
): number {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  return (safePage - 1) * safeSize;
}

/** Convert a legacy 0-based offset to a 1-based page. */
export function offsetToPage(
  offset: number,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
): number {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeSize = Math.max(1, Math.floor(pageSize));
  return Math.floor(safeOffset / safeSize) + 1;
}
