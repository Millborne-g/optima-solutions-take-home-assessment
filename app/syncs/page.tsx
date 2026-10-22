import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { OrderSync } from "@/entities/order/model/types";
import { listRecentSyncsPage } from "@/server/services/orderSyncService";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  offsetToPage,
  pageToOffset,
  parsePageParam,
} from "@/shared/lib/tablePagination";
import { SyncDashboardView } from "@/views/syncs/SyncDashboardView";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

export const instant = false;

const PAGE_SIZE = DEFAULT_TABLE_PAGE_SIZE;

type SearchParams = Promise<{ after?: string; page?: string; q?: string }>;
type PageProps = { searchParams: SearchParams };

async function SyncsPageContent(props: PageProps) {
  const searchParams = await props.searchParams;
  const q =
    typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const pageRaw =
    typeof searchParams?.page === "string" ? searchParams.page : undefined;
  const afterRaw =
    typeof searchParams?.after === "string" ? searchParams.after : undefined;

  // Legacy ?after=offset → ?page=N
  if (
    (pageRaw == null || pageRaw === "") &&
    afterRaw != null &&
    afterRaw !== ""
  ) {
    const parsedOffset = Number.parseInt(afterRaw, 10);
    if (Number.isFinite(parsedOffset) && parsedOffset >= 0) {
      const page = offsetToPage(parsedOffset, PAGE_SIZE);
      const params = new URLSearchParams();
      if (page > 1) params.set("page", String(page));
      if (q) params.set("q", q);
      const qs = params.toString();
      redirect(qs ? `/syncs?${qs}` : "/syncs");
    }
  }

  const page = parsePageParam(pageRaw);
  const offset = pageToOffset(page, PAGE_SIZE);

  let syncs: OrderSync[] = [];
  let hasMore = false;
  let total = 0;
  let fetchError: string | null = null;

  try {
    const result = await listRecentSyncsPage(offset, PAGE_SIZE, q || undefined);
    syncs = result.syncs;
    hasMore = result.hasMore;
    total = result.total;
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load sync attempts.";
    syncs = [];
    hasMore = false;
    total = 0;
  }

  return (
    <SyncDashboardView
      syncs={syncs}
      page={page}
      hasMore={hasMore}
      total={total}
      query={q}
      fetchError={fetchError}
    />
  );
}

export default function SyncsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" label="Loading syncs…" />
        </div>
      }
    >
      <SyncsPageContent {...props} />
    </Suspense>
  );
}
