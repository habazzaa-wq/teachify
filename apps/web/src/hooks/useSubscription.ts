"use client";

import { useTenantStore } from "@/stores/tenant.store";
import { useMemo } from "react";

export interface SubscriptionInfo {
  planName: string;
  planSlug: string;
  status: string;
  isActive: boolean;
  isExpired: boolean;
  isTrialing: boolean;
  isCanceled: boolean;
  daysRemaining: number;
  progress: number;
  startedAt: string | null;
  endsAt: string | null;
}

export function useSubscription(): SubscriptionInfo {
  const activeTenant = useTenantStore((state) => state.activeTenant);

  return useMemo(() => {
    const status = activeTenant?.status ?? "unknown";
    const isActive = status === "active";
    const isExpired = status === "expired";
    const isTrialing = status === "trial";
    const isCanceled = status === "canceled";

    const startedAt = null;
    const endsAt = null;
    const daysRemaining = 30;
    const progress = 75;

    return {
      planName: "نمو",
      planSlug: "growth",
      status,
      isActive,
      isExpired,
      isTrialing,
      isCanceled,
      daysRemaining,
      progress,
      startedAt,
      endsAt,
    };
  }, [activeTenant?.status]);
}
