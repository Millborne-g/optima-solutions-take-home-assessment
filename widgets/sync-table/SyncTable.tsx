"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRetrySync } from "@/features/retry-sync/useRetrySync";
import { TablePagination } from "@/shared/ui/TablePagination";
import { SyncCard } from "./SyncCard";
import { SyncTableRow, type SyncRowData } from "./SyncTableRow";

type SyncTableProps = {
  initialSyncs: SyncRowData[];
  page: number;
  hasMore: boolean;
  total: number;
};

export function SyncTable({
  initialSyncs,
  page,
  hasMore,
  total,
}: SyncTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncs, setSyncs] = useState(initialSyncs);

  const { state, retry } = useRetrySync((updated) => {
    setSyncs((prev) =>
      prev.map((s) => (s.orderId === updated.orderId ? { ...s, ...updated } : s)),
    );
  });

  function pushPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("after");
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(query ? `/syncs?${query}` : "/syncs");
  }

  function goPrevious() {
    if (page <= 1) return;
    pushPage(page - 1);
  }

  function goNext() {
    if (!hasMore) return;
    pushPage(page + 1);
  }

  if (syncs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-16 text-center">
        <p className="text-sm text-muted-foreground">No sync attempts yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Send a webhook with{" "}
          <code className="font-mono text-foreground">npm run send-webhook</code>
        </p>
      </div>
    );
  }

  const retryingOrderId =
    state.status === "loading" ? state.orderId : null;

  const newest = syncs[0]?.updatedAt ?? syncs[0]?.createdAt ?? null;
  const updatedLabel = newest
    ? `Updated ${new Date(newest).toLocaleString()}`
    : undefined;

  const meta = `Showing ${syncs.length} of ${total} sync attempts`;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface shadow-sm">
      <div aria-live="polite">
        {state.status === "error" && (
          <div
            className="border-b border-danger/30 bg-danger-bg px-4 py-2 text-sm text-danger"
            role="alert"
          >
            Retry for {state.orderId} failed: {state.message}
          </div>
        )}
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {syncs.map((sync) => (
          <SyncCard
            key={sync.orderId}
            sync={sync}
            isRetrying={retryingOrderId === sync.orderId}
            onRetry={retry}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-t-xl md:block">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-subtle">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Order ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Contact ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Deal ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Error
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sr-only"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {syncs.map((sync) => (
              <SyncTableRow
                key={sync.orderId}
                sync={sync}
                isRetrying={retryingOrderId === sync.orderId}
                onRetry={retry}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        hasPrevious={page > 1}
        hasNext={hasMore}
        onPrevious={goPrevious}
        onNext={goNext}
        meta={meta}
        trailingMeta={updatedLabel}
      />
    </div>
  );
}
