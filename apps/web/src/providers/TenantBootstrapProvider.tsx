"use client";

import { useEffect, useState } from "react";
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
import {
  classifyTenantResponse,
  TENANT_BOOTSTRAP_ERRORS,
} from "@/features/tenant-bootstrap/classify";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

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
  const [retryNonce, setRetryNonce] = useState(0);

  const bootstrapStatus = useTenantStore((s) => s.bootstrapStatus);
  const bootstrapError = useTenantStore((s) => s.bootstrapError);
  const setTenantBootstrap = useTenantStore((s) => s.setTenantBootstrap);
  const setBootstrapStatus = useTenantStore((s) => s.setBootstrapStatus);
  const setBootstrapError = useTenantStore((s) => s.setBootstrapError);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

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
      setBootstrapError(null);

      function scheduleRetry(attempts: number) {
        retryTimer = setTimeout(
          () => {
            void attempt(attempts + 1);
          },
          RETRY_BASE_DELAY_MS * Math.pow(2, attempts),
        );
      }

      async function attempt(attempts: number) {
        try {
          const res = await fetch(
            `/api/v1/tenant/by-domain?domain=${encodeURIComponent(hostname)}`,
            {
              headers: { Accept: "application/json" },
              cache: "no-store",
            },
          );

          const outcome = await classifyTenantResponse(res);
          if (cancelled) return;

          if (outcome.kind === "tenant") {
            const data = outcome.tenant;
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
            return;
          }

          // The API answered with a proper JSON 404: the domain really isn't
          // registered, so there is nothing to retry.
          if (outcome.kind === "not-found") {
            setBootstrapStatus("not-found");
            return;
          }

          // Infrastructure failure (5xx, unreachable API, misrouted proxy):
          // retry a few times, then surface a retryable error instead of
          // claiming the academy does not exist.
          if (attempts < MAX_RETRIES) {
            scheduleRetry(attempts);
            return;
          }

          setBootstrapError(outcome.message);
          setBootstrapStatus("error");
        } catch {
          if (cancelled) return;

          if (attempts < MAX_RETRIES) {
            scheduleRetry(attempts);
            return;
          }

          setBootstrapError(TENANT_BOOTSTRAP_ERRORS.network);
          setBootstrapStatus("error");
        }
      }

      void attempt(0);
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    platform,
    isSuperAdmin,
    tenantContext,
    hostname,
    pathname,
    retryNonce,
    setTenantBootstrap,
    setBootstrapStatus,
    setBootstrapError,
    setPlatformBranding,
  ]);

  if (bootstrapStatus === "loading" || bootstrapStatus === "idle") {
    return <TenantLoading />;
  }

  if (bootstrapStatus === "not-found") {
    return <TenantNotFound />;
  }

  if (bootstrapStatus === "error") {
    return (
      <TenantBootstrapError
        error={bootstrapError ?? "حدث خطأ في تحميل بيانات الأكاديمية"}
        onRetry={() => setRetryNonce((nonce) => nonce + 1)}
      />
    );
  }

  return <>{children}</>;
}
