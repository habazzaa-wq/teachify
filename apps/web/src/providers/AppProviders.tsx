"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { TenantBootstrapProvider } from "./TenantBootstrapProvider";
import { TenantProvider } from "./TenantProvider";
import { TenantFontProvider } from "@/components/layout/TenantFontProvider";
import { BrandThemeProvider } from "@/components/layout/BrandThemeProvider";
import { ActiveExamProvider } from "@/features/exam-session/providers/ActiveExamProvider";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

const Toaster = dynamic(
  () => import("@/components/system/Toaster").then((m) => m.Toaster),
  { ssr: false },
);

function PauseAnimationsWhileScrolling() {
  useEffect(() => {
    let timeout: number | undefined;
    const onScroll = () => {
      document.body.classList.add("page-is-scrolling");
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        document.body.classList.remove("page-is-scrolling");
      }, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timeout) window.clearTimeout(timeout);
      document.body.classList.remove("page-is-scrolling");
    };
  }, []);
  return null;
}

/**
 * Providers required by every route, including fully anonymous pages.
 *
 * Auth-dependent providers (AuthProvider / PermissionProvider) intentionally
 * live outside this tree and are mounted by route groups that require them, so
 * the public homepage never ships session/dashboard code.
 */
export function AppProviders({
  children,
  serverHostname,
  tenantContext,
}: {
  children: React.ReactNode;
  serverHostname?: string;
  tenantContext?: TenantByDomainResponse | null;
}) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <ThemeProvider>
        <QueryProvider>
          <TenantBootstrapProvider 
            serverHostname={serverHostname}
            tenantContext={tenantContext}
          >
            <TenantProvider>
              <PauseAnimationsWhileScrolling />
              <TenantFontProvider />
              <BrandThemeProvider />
              {children}
              <ActiveExamProvider />
              <Toaster />
            </TenantProvider>
          </TenantBootstrapProvider>
        </QueryProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
