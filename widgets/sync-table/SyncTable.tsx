"use client";

import { useState } from "react";
import { useRetrySync } from "@/features/retry-sync/useRetrySync";
import { SyncTableRow, type SyncRowData } from "./SyncTableRow";

type SyncTableProps = {
  initialSyncs: SyncRowData[];
};

export function SyncTable({ initialSyncs }: SyncTableProps) {
  const [syncs, setSyncs] = useState(initialSyncs);

  const { state, retry } = useRetrySync((updated) => {
    setSyncs((prev) =>
      prev.map((s) => (s.orderId === updated.orderId ? { ...s, ...updated } : s)),
    );
  });

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

  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
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
      <table className="w-full min-w-[800px] text-left">
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
  );
}
