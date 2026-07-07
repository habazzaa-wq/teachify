"use client";

import { useTenantContext } from "@/providers/TenantProvider";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Access the active tenant and full membership/role/permission context.
 */
export function useActiveTenant() {
  const { activeTenant, hydrated, setActiveTenant } = useTenantContext();
  const membership = useTenantStore((state) => state.membership);

  return {
    tenant: activeTenant,
    membership,
    hydrated,
    hasTenant: activeTenant !== null,
    setActiveTenant,
  };
}
