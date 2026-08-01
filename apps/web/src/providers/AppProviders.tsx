"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { TenantBootstrapProvider } from "./TenantBootstrapProvider";
import { TenantProvider } from "./TenantProvider";
import { AuthProvider } from "./AuthProvider";
import { PermissionProvider } from "./PermissionProvider";

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

export function AppProviders({
  children,
  serverHostname,
  tenantContext,
}: {
  children: React.ReactNode;
  serverHostname?: string;
  tenantContext?: any;
}) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TenantBootstrapProvider 
          serverHostname={serverHostname}
          tenantContext={tenantContext}
        >
          <TenantProvider>
            <AuthProvider>
              <PermissionProvider>
                <PauseAnimationsWhileScrolling />
                {children}
                <Toaster
                  position="top-center"
                  dir="rtl"
                  richColors
                  closeButton
                />
              </PermissionProvider>
            </AuthProvider>
          </TenantProvider>
        </TenantBootstrapProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
