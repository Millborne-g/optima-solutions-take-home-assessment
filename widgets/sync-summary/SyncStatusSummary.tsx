import type { OrderSync, SyncStatus } from "@/entities/order/model/types";
import { cn } from "@/shared/lib/cn";

type SyncStatusSummaryProps = {
  syncs: OrderSync[];
};

const TILES: { status: SyncStatus; label: string; accent: string; dot: string }[] = [
  {
    status: "success",
    label: "Success",
    accent: "border-l-success",
    dot: "bg-success",
  },
  {
    status: "failed",
    label: "Failed",
    accent: "border-l-danger",
    dot: "bg-danger",
  },
  {
    status: "processing",
    label: "Processing",
    accent: "border-l-warning",
    dot: "bg-warning",
  },
  {
    status: "pending",
    label: "Pending",
    accent: "border-l-pending",
    dot: "bg-pending",
  },
];

export function SyncStatusSummary({ syncs }: SyncStatusSummaryProps) {
  const counts: Record<SyncStatus, number> = {
    success: 0,
    failed: 0,
    processing: 0,
    pending: 0,
  };
  for (const sync of syncs) {
    counts[sync.status] += 1;
  }

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map((tile) => (
        <div
          key={tile.status}
          className={cn(
            "rounded-xl border border-border bg-surface-subtle px-5 py-5",
            "border-l-[3px]",
            tile.accent,
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tile.dot)}
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">{tile.label}</p>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {counts[tile.status]}
          </p>
        </div>
      ))}
    </div>
  );
}
