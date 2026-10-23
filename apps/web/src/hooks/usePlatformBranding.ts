"use client";

import { useTenantContext } from "@/providers/TenantProvider";

/**
 * The platform-level brand (colors, name, logo) with the server-resolved tenant
 * as the initial value, so SSR and hydration already render the real branding
 * instead of the platform defaults (no flash before the client store fills in).
 */
export function usePlatformBranding() {
  return useTenantContext().platformBranding;
}
