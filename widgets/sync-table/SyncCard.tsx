"use client";

import { Button } from "@/shared/ui/Button";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import type { SyncRowData } from "./SyncTableRow";

type SyncCardProps = {
  sync: SyncRowData;
  isRetrying: boolean;
  onRetry: (orderId: string) => void;
};

function formatTs(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function SyncCard({ sync, isRetrying, onRetry }: SyncCardProps) {
  const timestamp = formatTs(sync.lastAttemptedAt ?? sync.createdAt);
  const showRetry =
    sync.status === "failed" || sync.status === "processing";

  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{sync.orderId}</h3>
        <StatusBadge status={sync.status} />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Timestamp
          </dt>
          <dd className="mt-0.5 text-muted-foreground">{timestamp}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contact ID
          </dt>
          <dd
            className="mt-0.5 break-all font-mono text-xs text-muted-foreground"
            title={sync.hubspotContactId ?? undefined}
          >
            {sync.hubspotContactId ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Deal ID
          </dt>
          <dd
            className="mt-0.5 break-all font-mono text-xs text-muted-foreground"
            title={sync.hubspotDealId ?? undefined}
          >
            {sync.hubspotDealId ?? "—"}
          </dd>
        </div>
        {sync.errorMessage && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Error
            </dt>
            <dd className="mt-0.5 text-danger">{sync.errorMessage}</dd>
          </div>
        )}
      </dl>

      {showRetry && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            isLoading={isRetrying}
            onClick={() => onRetry(sync.orderId)}
            disabled={isRetrying}
            aria-label={`Retry sync for ${sync.orderId}`}
          >
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
        </div>
      )}
    </article>
  );
}
