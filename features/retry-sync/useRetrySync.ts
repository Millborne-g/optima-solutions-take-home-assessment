"use client";

import { useState } from "react";
import type { OrderSync } from "@/entities/order/model/types";

export type RetryState =
  | { status: "idle" }
  | { status: "loading"; orderId: string }
  | { status: "error"; orderId: string; message: string };

type SyncRow = Pick<
  OrderSync,
  | "orderId"
  | "status"
  | "hubspotContactId"
  | "hubspotDealId"
  | "errorMessage"
  | "attemptCount"
  | "lastAttemptedAt"
  | "createdAt"
  | "updatedAt"
>;

export function useRetrySync(onUpdated: (sync: SyncRow) => void) {
  const [state, setState] = useState<RetryState>({ status: "idle" });

  async function retry(orderId: string) {
    setState({ status: "loading", orderId });

    try {
      const res = await fetch(
        `/api/syncs/${encodeURIComponent(orderId)}/retry`,
        { method: "POST" },
      );
      const data = (await res.json()) as
        | SyncRow
        | { error: string; code: string };

      if (!res.ok) {
        setState({
          status: "error",
          orderId,
          message: "error" in data ? data.error : `Retry failed (${res.status})`,
        });
        return;
      }

      if ("orderId" in data) {
        onUpdated(data);
      }
      setState({ status: "idle" });
    } catch {
      setState({
        status: "error",
        orderId,
        message: "Network error. Please try again.",
      });
    }
  }

  return { state, retry };
}
