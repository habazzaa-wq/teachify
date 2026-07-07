"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EVENTS } from "@/services/api/axios";
import { useTenantStore } from "@/stores/tenant.store";
import type { ActiveTenant } from "@/types/tenant.types";

interface TenantProviderValue {
  activeTenant: ActiveTenant | null;
  hydrated: boolean;
  setActiveTenant: (tenant: ActiveTenant | null) => void;
}

const TenantContext = createContext<TenantProviderValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);
  const clear = useTenantStore((state) => state.clear);
  const [hydrated, setHydrated] = useState(false);

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
    () => ({ activeTenant, hydrated, setActiveTenant }),
    [activeTenant, hydrated, setActiveTenant],
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
