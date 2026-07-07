"use client";

import { useTenantStore } from "@/stores/tenant.store";
import { useMemo } from "react";

export interface TenantStatusInfo {
  isActive: boolean;
  isSuspended: boolean;
  isExpired: boolean;
  isPending: boolean;
  statusLabel: string;
  statusVariant: "success" | "destructive" | "warning" | "secondary";
}

export function useTenantStatus(): TenantStatusInfo {
  const activeTenant = useTenantStore((state) => state.activeTenant);

  return useMemo(() => {
    const status = activeTenant?.status ?? "unknown";

    const map: Record<string, TenantStatusInfo> = {
      active: {
        isActive: true,
        isSuspended: false,
        isExpired: false,
        isPending: false,
        statusLabel: "نشط",
        statusVariant: "success",
      },
      suspended: {
        isActive: false,
        isSuspended: true,
        isExpired: false,
        isPending: false,
        statusLabel: "موقوف",
        statusVariant: "destructive",
      },
      expired: {
        isActive: false,
        isSuspended: false,
        isExpired: true,
        isPending: false,
        statusLabel: "منتهي",
        statusVariant: "destructive",
      },
      pending: {
        isActive: false,
        isSuspended: false,
        isExpired: false,
        isPending: true,
        statusLabel: "قيد الانتظار",
        statusVariant: "warning",
      },
    };

    return (
      map[status] ?? {
        isActive: false,
        isSuspended: false,
        isExpired: false,
        isPending: false,
        statusLabel: "غير معروف",
        statusVariant: "secondary",
      }
    );
  }, [activeTenant?.status]);
}
