import type { SyncStatus } from "@/entities/order/model/types";
import { cn } from "@/shared/lib/cn";

const statusStyles: Record<SyncStatus, string> = {
  pending: "bg-pending-bg text-pending border-pending/30",
  processing: "bg-warning-bg text-warning border-warning/30",
  success: "bg-success-bg text-success border-success/30",
  failed: "bg-danger-bg text-danger border-danger/30",
};

const statusLabels: Record<SyncStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Success",
  failed: "Failed",
};

type StatusBadgeProps = {
  status: SyncStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className,
      )}
    >
      <StatusDot status={status} />
      {statusLabels[status]}
    </span>
  );
}

function StatusDot({ status }: { status: SyncStatus }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "success" && "bg-success",
        status === "failed" && "bg-danger",
        status === "processing" && "bg-warning",
        status === "pending" && "bg-pending",
      )}
      aria-hidden="true"
    />
  );
}
