"use client";

import { useEffect, useRef, useState } from "react";
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

async function fetchTenant(hostname: string) {
  const res = await fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(hostname)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

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
  const [resolving, setResolving] = useState(false);

  const bootstrapStatus = useTenantStore((s) => s.bootstrapStatus);
  const setTenantBootstrap = useTenantStore((s) => s.setTenantBootstrap);
  const setBootstrapStatus = useTenantStore((s) => s.setBootstrapStatus);

  useEffect(() => {
    if (platform || isSuperAdmin || pathname === "/tenant-not-found") {
      setBootstrapStatus("resolved");
      return;
    }

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

    if (!platform && !isSuperAdmin && !tenantContext && hostname) {
      setResolving(true);
      fetchTenant(hostname)
        .then((data) => {
          if (data && data.status === "active") {
            setTenantBootstrap({
              id: data.id,
              name: data.name,
              slug: data.slug,
              domain: hostname,
              status: data.status,
              branding: data.branding ?? null,
              subdomain: getTenantSubdomain(hostname),
            });
          } else {
            setBootstrapStatus("not-found");
          }
        })
        .catch(() => {
          setBootstrapStatus("not-found");
        })
        .finally(() => setResolving(false));
    }
  }, [platform, isSuperAdmin, tenantContext, hostname, pathname, setTenantBootstrap, setBootstrapStatus]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (bootstrapStatus === "idle" && !resolving) {
      timeoutRef.current = setTimeout(() => {
        setBootstrapStatus("not-found");
      }, 8000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [bootstrapStatus, resolving, setBootstrapStatus]);

  if (bootstrapStatus === "loading" || bootstrapStatus === "idle") {
    return <>{children}</>;
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
