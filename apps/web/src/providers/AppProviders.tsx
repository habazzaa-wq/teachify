"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { TenantBootstrapProvider } from "./TenantBootstrapProvider";
import { TenantProvider } from "./TenantProvider";
import { AuthProvider } from "./AuthProvider";
import { PermissionProvider } from "./PermissionProvider";

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
