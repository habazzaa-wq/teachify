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

  // نتأكد إن ألوان المنصة اتحمّلت مرة واحدة بس عشان نمنع إعادة الطلب وفقدان
  // الثيم (فlicker) عند التنقّل بين الصفحات.
  const platformBrandingLoaded = useRef(false);

  useEffect(() => {
    const platformOrSuper =
      platform || isSuperAdmin || pathname === "/tenant-not-found";

    // نأكد دايماً إن ألوان المنصة (platform_branding) متحمّلة، لأنها المصدر
    // الموحّد لألوان كامل المنصة (الموقع العام + كل اللوحات + صفحة الدخول)
    // سواء الزائر أو المسجّل دخول، وعلى الدومين الأساسي أو أي سب-دومين. الألوان
    // دي مستقلة تماماً عن مظهر المدرس فمفيش خطر إنها تتداخل مع ثيم اللوحة.
    if (tenantContext?.platformBranding) {
      setPlatformBranding(tenantContext.platformBranding);
    } else if (
      !platformBrandingLoaded.current &&
      (platformOrSuper || useTenantStore.getState().activeTenant)
    ) {
      // مفيش هيدر x-tenant-context → نجيب ألوان المنصة من الـ API العام.
      platformBrandingLoaded.current = true;
      fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(hostname)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.platform_branding) setPlatformBranding(data.platform_branding);
        })
        .catch(() => {
          // لو فشل، نسمح بإعادة المحاولة في التنقّل الجاي.
          platformBrandingLoaded.current = false;
        });
    }

    // المنصة/السوبر أدمن: مفيش tenant فرعي، نكتفي بتحميل ألوان المنصة.
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
        platformBranding: tenantContext.platformBranding ?? null,
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
                platformBranding: data.platformBranding ?? null,
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
