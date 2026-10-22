"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrderSync } from "@/entities/order/model/types";
import { SyncTable } from "@/widgets/sync-table/SyncTable";
import { DebouncedSearchField } from "@/shared/ui/DebouncedSearchField";
import { PageContainer, PageHeader } from "@/shared/ui/PageContainer";

type SyncDashboardViewProps = {
  syncs: OrderSync[];
  page: number;
  hasMore: boolean;
  total: number;
  query?: string;
  fetchError?: string | null;
};

export function SyncDashboardView({
  syncs,
  page,
  hasMore,
  total,
  query = "",
  fetchError,
}: SyncDashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const commitSearch = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("after");
      params.delete("page");
      if (next === "") {
        params.delete("q");
      } else {
        params.set("q", next);
      }
      const qs = params.toString();
      router.push(qs ? `/syncs?${qs}` : "/syncs");
    },
    [router, searchParams],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Order syncs"
        description="Last webhook sync attempts to HubSpot"
        actions={
          <DebouncedSearchField
            key={query || "__empty"}
            className="md:ml-auto"
            initialValue={query}
            onCommit={commitSearch}
            placeholder="Search order ID"
            aria-label="Search order ID"
          />
        }
      />

      {fetchError && (
        <div
          className="mb-4 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <strong>Error:</strong> {fetchError}
        </div>
      )}

      <SyncTable
        key={syncs.map((s) => s.orderId).join("|") || "empty"}
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
        page={page}
        hasMore={hasMore}
        total={total}
      />
    </PageContainer>
  );
}
