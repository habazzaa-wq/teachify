"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getHostname,
  getTenantSubdomain,
  isPlatformDomain,
} from "@/lib/domain";
import { useTenantStore } from "@/stores/tenant.store";
import { TenantLoading } from "@/components/system/TenantLoading";
import { TenantNotFound } from "@/components/system/TenantNotFound";
import { TenantBootstrapError } from "@/components/system/TenantBootstrapError";
import { isSuperAdminPath } from "@/constants/routes";
import { env } from "@/config/env";

export function TenantBootstrapProvider({
  children,
  serverHostname,
  tenantContext,
}: {
  children: React.ReactNode;
  serverHostname?: string;
  tenantContext?: any;
}) {
  const pathname = usePathname();
  const hostname = getHostname() || serverHostname || "";
  const platform = isPlatformDomain(hostname);
  const isSuperAdmin = isSuperAdminPath(pathname);

  const bootstrapStatus = useTenantStore((s) => s.bootstrapStatus);
  const setTenantBootstrap = useTenantStore((s) => s.setTenantBootstrap);
  const setBootstrapStatus = useTenantStore((s) => s.setBootstrapStatus);

  useEffect(() => {
    // If we are on platform domain, super admin, or the not-found page itself, we are good
    if (platform || isSuperAdmin || pathname === "/tenant-not-found") {
      setBootstrapStatus("resolved");
      return;
    }

    // If we have tenant context from server, use it
    if (tenantContext) {
      setTenantBootstrap({
        id: tenantContext.id,
        name: tenantContext.name,
        slug: tenantContext.slug,
        domain: tenantContext.domain,
        status: tenantContext.status,
        branding: tenantContext.branding,
        subdomain: getTenantSubdomain(hostname),
      });
      return;
    }

    // Fallback for development if no middleware is active
    if (process.env.NODE_ENV === "development" && hostname === "localhost" && env.devTenant) {
        setTenantBootstrap({
          id: env.devTenant.id,
          name: env.devTenant.name,
          slug: env.devTenant.slug,
          domain: "localhost",
          status: env.devTenant.status,
          branding: {
            logo: null,
            favicon: null,
            primaryColor: null,
            secondaryColor: null,
            accentColor: null,
            font: null,
            darkLogo: null,
            lightLogo: null,
          },
          subdomain: null,
        });
        return;
    }

    // If we reach here and we are not on platform, it means tenant resolution failed in middleware
    // but the request still reached here (shouldn't happen with proper middleware)
    if (!platform && !isSuperAdmin && !tenantContext) {
      setBootstrapStatus("not-found");
    }
  }, [platform, isSuperAdmin, tenantContext, hostname, pathname, setTenantBootstrap, setBootstrapStatus]);

  // Fallback: if bootstrap stays idle for too long, force to not-found
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (bootstrapStatus === "idle") {
      timeoutRef.current = setTimeout(() => {
        setBootstrapStatus("not-found");
      }, 8000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [bootstrapStatus, setBootstrapStatus]);

  if (bootstrapStatus === "loading" || bootstrapStatus === "idle") {
    return <TenantLoading />;
  }

  if (bootstrapStatus === "not-found") {
    return <TenantNotFound />;
  }

  if (bootstrapStatus === "error") {
    return (
      <TenantBootstrapError
        error={useTenantStore.getState().bootstrapError ?? "حدث خطأ في تحميل بيانات الأكاديمية"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <>{children}</>;
}
