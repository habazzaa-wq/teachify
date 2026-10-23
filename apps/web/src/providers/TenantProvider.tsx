"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EVENTS } from "@/constants/auth-events";
import { useTenantStore } from "@/stores/tenant.store";
import type { TenantBranding } from "@/features/tenant-bootstrap/types";
import type { ActiveTenant } from "@/types/tenant.types";

interface TenantProviderValue {
  activeTenant: ActiveTenant | null;
  platformBranding: TenantBranding | null;
  hydrated: boolean;
  setActiveTenant: (tenant: ActiveTenant | null) => void;
}

const TenantContext = createContext<TenantProviderValue | null>(null);

export function TenantProvider({
  children,
  initialTenant = null,
  initialPlatformBranding = null,
}: {
  children: React.ReactNode;
  /**
   * Tenant payload resolved on the server. Used until the client store is
   * populated so the first HTML paint already shows the tenant's real name,
   * logo, colors and font instead of the platform defaults.
   */
  initialTenant?: ActiveTenant | null;
  initialPlatformBranding?: TenantBranding | null;
}) {
  const storeActiveTenant = useTenantStore((state) => state.activeTenant);
  const storePlatformBranding = useTenantStore((state) => state.platformBranding);
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);
  const clear = useTenantStore((state) => state.clear);
  const [hydrated, setHydrated] = useState(false);

  const activeTenant = storeActiveTenant ?? initialTenant;
  const platformBranding = storePlatformBranding ?? initialPlatformBranding;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    function handleTenantInvalid() {
      clear();
    }

    window.addEventListener(AUTH_EVENTS.tenantInvalid, handleTenantInvalid);

    return () => {
      window.removeEventListener(
        AUTH_EVENTS.tenantInvalid,
        handleTenantInvalid,
      );
    };
  }, [clear]);

  const value = useMemo<TenantProviderValue>(
    () => ({ activeTenant, platformBranding, hydrated, setActiveTenant }),
    [activeTenant, platformBranding, hydrated, setActiveTenant],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenantContext(): TenantProviderValue {
  const ctx = useContext(TenantContext);

  if (!ctx) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }

  return ctx;
}
