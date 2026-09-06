"use client";

import { useEffect } from "react";
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
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

const MAX_RETRIES = 3;

export function TenantBootstrapProvider({
  children,
  serverHostname,
  tenantContext,
}: {
  children: React.ReactNode;
  serverHostname?: string;
  tenantContext?: TenantByDomainResponse | null;
}) {
  const pathname = usePathname();
  const hostname = getHostname() || serverHostname || "";
  const platform = isPlatformDomain(hostname);
  const isSuperAdmin = isSuperAdminPath(pathname);

  const bootstrapStatus = useTenantStore((s) => s.bootstrapStatus);
  const setTenantBootstrap = useTenantStore((s) => s.setTenantBootstrap);
  const setBootstrapStatus = useTenantStore((s) => s.setBootstrapStatus);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);

  useEffect(() => {
    const platformOrSuper =
      platform || isSuperAdmin || pathname === "/tenant-not-found";

    // ألوان المنصة (platformBranding) بتتم إدارتها بالكامل من BrandThemeProvider
    // (تحميل ذاتي مستقل عن البوتستراب/تسجيل الدخول). هنا بنكتفي ببذرها من سياق
    // السيرفر (SSR) لو موجودة عشان أول رسمية تكون صح من غير وميض.
    const platformBranding = tenantContext?.platform_branding ?? tenantContext?.platformBranding ?? null;
    if (platformBranding) {
      setPlatformBranding(platformBranding);
    }

    // المنصة/السوبر أدمن: مفيش tenant فرعي، نكتفي ببذر ألوان المنصة.
    if (platformOrSuper) {
      setBootstrapStatus("resolved");
      return;
    }

    // Already bootstrapped (e.g. via login/me). Never re-clobber the tenant's
    // branding colors on client-side navigation — doing so resets the
    // control-panel colors back to defaults and causes them to "change on their
    // own" between pages.
    if (useTenantStore.getState().activeTenant) {
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
        platformBranding: tenantContext.platform_branding ?? tenantContext.platformBranding ?? null,
        subdomain: getTenantSubdomain(hostname),
      });
      return;
    }

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

    if (!platform && !isSuperAdmin && !tenantContext) {
      setBootstrapStatus("loading");

      const attempt = (attempts: number) => {
        fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(hostname)}`)
          .then((res) => {
            if (!res.ok) throw new Error("Tenant not found");
            return res.json();
          })
          .then((data) => {
            if (data && data.status === "active") {
              setTenantBootstrap({
                id: data.id,
                name: data.name,
                slug: data.slug,
                domain: data.domain,
                status: data.status,
                branding: data.branding,
                platformBranding: data.platform_branding ?? data.platformBranding ?? null,
                subdomain: getTenantSubdomain(hostname),
              });
            } else {
              setBootstrapStatus("not-found");
            }
          })
          .catch(() => {
            if (attempts < MAX_RETRIES) {
              setTimeout(() => attempt(attempts + 1), 1000 * Math.pow(2, attempts));
            } else {
              setBootstrapStatus("not-found");
            }
          });
      };

      attempt(0);
    }
  }, [platform, isSuperAdmin, tenantContext, hostname, pathname, setTenantBootstrap, setBootstrapStatus, setPlatformBranding]);

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
