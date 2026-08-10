"use client";

import { useTenantStore } from "@/stores/tenant.store";
import { resolveBrandHexColors } from "@/lib/brand";

/**
 * Reactive access to the configured site brand colors (hex strings, always
 * 6-digit uppercase). Falls back to the platform defaults when the tenant has
 * not customized them.
 */
export function useBrandColors() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const branding = useTenantStore((s) => s.branding);
  return resolveBrandHexColors(activeTenant, branding);
}
