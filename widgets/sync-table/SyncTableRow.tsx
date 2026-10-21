"use client";

import type { SyncStatus } from "@/entities/order/model/types";
import { Button } from "@/shared/ui/Button";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export type SyncRowData = {
  orderId: string;
  status: SyncStatus;
  hubspotContactId: string | null;
  hubspotDealId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  lastAttemptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SyncTableRowProps = {
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

function truncate(text: string | null, max = 120): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function SyncTableRow({
  sync,
  isRetrying,
  onRetry,
}: SyncTableRowProps) {
  return (
    <tr className="transition-colors hover:bg-surface-subtle">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {sync.orderId}
      </td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={sync.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {formatTs(sync.lastAttemptedAt ?? sync.createdAt)}
      </td>
      <td
        className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-muted-foreground"
        title={sync.hubspotContactId ?? undefined}
      >
        {sync.hubspotContactId ?? "—"}
      </td>
      <td
        className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-muted-foreground"
        title={sync.hubspotDealId ?? undefined}
      >
        {sync.hubspotDealId ?? "—"}
      </td>
      <td
        className="max-w-xs px-4 py-3 text-sm text-danger"
        title={sync.errorMessage ?? undefined}
      >
        {truncate(sync.errorMessage)}
      </td>
      <td className="px-4 py-3 text-right">
        {(sync.status === "failed" || sync.status === "processing") && (
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
        )}
      </td>
    </tr>
  );
}
