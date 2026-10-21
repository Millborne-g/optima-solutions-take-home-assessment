import type { OrderSync } from "@/entities/order/model/types";
import { SyncTable } from "@/widgets/sync-table/SyncTable";
import { SyncStatusSummary } from "@/widgets/sync-summary/SyncStatusSummary";

type SyncDashboardViewProps = {
  syncs: OrderSync[];
  fetchError?: string | null;
};

export function SyncDashboardView({
  syncs,
  fetchError,
}: SyncDashboardViewProps) {
  return (
    <div className="mx-auto max-w-6xl min-w-0">
      <header className="mb-6 hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">Order syncs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last 50 webhook sync attempts to HubSpot
        </p>
      </header>

      {fetchError && (
        <div
          className="mb-4 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <strong>Error:</strong> {fetchError}
        </div>
      )}

      <SyncStatusSummary syncs={syncs} />

      <SyncTable
        initialSyncs={syncs.map((s) => ({
          orderId: s.orderId,
          status: s.status,
          hubspotContactId: s.hubspotContactId,
          hubspotDealId: s.hubspotDealId,
          errorMessage: s.errorMessage,
          attemptCount: s.attemptCount,
          lastAttemptedAt: s.lastAttemptedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))}
      />
    </div>
  );
}
