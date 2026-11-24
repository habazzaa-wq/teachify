"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EVENTS } from "@/constants/auth-events";
import { useTenantStore } from "@/stores/tenant.store";
import type { TenantBranding } from "@/features/tenant-bootstrap/types";
import type { ActiveTenant } from "@/types/tenant.types";
import { mergeTenantSeedWithStored } from "@/lib/tenant-seed";

interface TenantProviderValue {
  activeTenant: ActiveTenant | null;
  platformBranding: TenantBranding | null;
  hydrated: boolean;
  setActiveTenant: (tenant: ActiveTenant | null) => void;
}

const TenantContext = createContext<TenantProviderValue | null>(null);

function tenantSyncSignature(tenant: ActiveTenant | null): string {
  if (!tenant) return "";
  return JSON.stringify({
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    feature_flags: tenant.feature_flags,
    branding: tenant.branding,
    platform_branding: tenant.platform_branding ?? tenant.platformBranding,
  });
}

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
  const fontOverridden = useTenantStore((state) => state.fontOverridden);
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);
  const clear = useTenantStore((state) => state.clear);
  const [hydrated, setHydrated] = useState(false);

  // The hostname-resolved server payload is authoritative. A stale persisted
  // tenant used to win here after hydration, swapping the saved font and hiding
  // the instructors nav link. Keep live font changes made in this session.
  const liveFont = fontOverridden
    ? (storePlatformBranding?.font ?? storeActiveTenant?.branding?.font ?? null)
    : undefined;
  const activeTenant = useMemo(
    () => mergeTenantSeedWithStored(initialTenant, storeActiveTenant, liveFont),
    [initialTenant, storeActiveTenant, liveFont],
  );
  const platformBranding = storePlatformBranding ?? initialPlatformBranding;

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Persist the authoritative merge so components that read the Zustand store
  // directly (brand colors, sidebar flags) no longer see the stale copy either.
  useEffect(() => {
    if (!initialTenant || !activeTenant) return;
    if (tenantSyncSignature(storeActiveTenant) !== tenantSyncSignature(activeTenant)) {
      setActiveTenant(activeTenant);
    }
  }, [activeTenant, initialTenant, setActiveTenant, storeActiveTenant]);

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
