"use client";

import { useActiveTenant } from "@/hooks/useActiveTenant";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";
import { useUiStore } from "@/stores/ui.store";
import { FooterContent } from "@/components/footer/FooterContent";
import { useMergedPublicFooter } from "@/features/footer/hooks";

/**
 * Storefront footer. All rendering lives in `FooterContent`, which is also
 * used by the dashboard editor preview, so the live site and the preview can
 * never drift apart. Brand colors and the tenant font come from the global
 * theme variables.
 */
export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = usePlatformBranding();
  const { data: footer } = useMergedPublicFooter();

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo =
    theme === "dark"
      ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
      : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";

  return <FooterContent settings={footer} tenantName={tenantName} logo={logo} />;
}
