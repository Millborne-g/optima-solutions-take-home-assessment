import { Suspense } from "react";
import type { OrderSync } from "@/entities/order/model/types";
import { listRecentSyncs } from "@/server/services/orderSyncService";
import { SyncDashboardView } from "@/views/syncs/SyncDashboardView";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

export const instant = false;

async function SyncsPageContent() {
  let syncs: OrderSync[] = [];
  let fetchError: string | null = null;

  try {
    syncs = await listRecentSyncs(50);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load sync attempts.";
    syncs = [];
  }

  return <SyncDashboardView syncs={syncs} fetchError={fetchError} />;
}

export default function SyncsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" label="Loading syncs…" />
        </div>
      }
    >
      <SyncsPageContent />
    </Suspense>
  );
}
