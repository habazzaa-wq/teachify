"use client";

import { useTenantStore } from "@/stores/tenant.store";
import { useMemo } from "react";

export interface SubscriptionInfo {
  planName: string | null;
  planSlug: string | null;
  planId: number | null;
  status: string;
  isActive: boolean;
  isExpired: boolean;
  isTrialing: boolean;
  isCanceled: boolean;
  /** NULL when the tenant has no end date, or no assigned plan. */
  daysRemaining: number | null;
  startedAt: string | null;
  endsAt: string | null;
}

function daysUntil(endsAt: string | null): number | null {
  if (!endsAt) return null;

  const end = new Date(endsAt).getTime();

  if (Number.isNaN(end)) return null;

  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

export function useSubscription(): SubscriptionInfo {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const plan = activeTenant?.platform_plan ?? null;
  const subscription = activeTenant?.subscription ?? null;

  return useMemo(() => {
    const status = subscription?.status ?? activeTenant?.status ?? "unknown";
    const endsAt = subscription?.ends_at ?? null;

    return {
      // The canonical plan from `platform_plans`; NULL when unassigned. The
      // legacy `tenants.plan` JSON is deliberately not used as a plan name.
      planName: plan?.name ?? null,
      planSlug: plan?.slug ?? null,
      planId: plan?.id ?? activeTenant?.platform_plan_id ?? null,
      status,
      isActive: status === "active",
      isExpired: status === "expired",
      isTrialing: status === "trial",
      isCanceled: status === "canceled",
      daysRemaining: daysUntil(endsAt),
      startedAt: subscription?.started_at ?? null,
      endsAt,
    };
  }, [activeTenant?.status, activeTenant?.platform_plan_id, plan, subscription]);
}
