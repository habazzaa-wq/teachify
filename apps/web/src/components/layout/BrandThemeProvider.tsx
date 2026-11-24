"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTenantStore } from "@/stores/tenant.store";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  DASHBOARD_THEME_BODY_CLASS,
  isDashboardPath,
  resolveBrandThemeColors,
  resolveDashboardBrandColors,
} from "@/lib/brand-theme";

/**
 * Applies TWO independent color systems to their own surfaces:
 *
 *  · `platformBranding` (ألوان الموقع, settings/branding) → :root, .dark,
 *    .community-theme and the `--brand-*` raw tokens = public website only.
 *  · `activeTenant.branding` (الألوان المخصصة, settings/appearance) →
 *    .tenant-theme, .student-theme and body.dashboard-theme = dashboards only
 *    (/teacher/*, /instructor/*, /tenant-login, /student/*).
 *
 * Changing one palette can no longer recolor the other surface.
 *
 * FOUC: the real colors are pre-rendered server-side into the same <style> id
 * by BrandThemeSSR. On the client we rewrite that element in place once the
 * live palettes are known, never replacing real colors with fallbacks.
 */
export function BrandThemeProvider() {
  const platformBranding = usePlatformBranding();
  const appearanceBranding = useTenantStore((s) => s.activeTenant?.branding);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);
  const pathname = usePathname();
  const loadRef = useRef(false);

  // Self-load the public-site palette once, independent of login state.
  useEffect(() => {
    if (platformBranding || loadRef.current) return;
    loadRef.current = true;
    const host = window.location.host;
    fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(host)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.platform_branding) setPlatformBranding(data.platform_branding);
      })
      .catch(() => {
        // Allow a retry on the next render if the request failed.
        loadRef.current = false;
      });
  }, [platformBranding, setPlatformBranding]);

  // Portals (dialogs, selects, toasts) mount on <body>, outside .tenant-theme.
  // Mark dashboard routes so they inherit the dashboard palette there too.
  useEffect(() => {
    if (!isDashboardPath(pathname)) return;
    document.body.classList.add(DASHBOARD_THEME_BODY_CLASS);
    return () => document.body.classList.remove(DASHBOARD_THEME_BODY_CLASS);
  }, [pathname]);

  const platform = useMemo(
    () => resolveBrandThemeColors(platformBranding),
    [platformBranding],
  );
  // Unset dashboard colors fall back to dashboard defaults — never to the
  // public site pair — so the two systems stay fully independent.
  const dashboard = useMemo(
    () => resolveDashboardBrandColors(appearanceBranding),
    [appearanceBranding],
  );

  const css = useMemo(
    () => buildBrandThemeCss(platform.primary, platform.secondary, dashboard),
    [platform, dashboard],
  );

  useEffect(() => {
    // Do not overwrite the SSR stylesheet with fallbacks while either palette
    // is still loading. Once real branding arrives, rewrite the same node.
    if (!platformBranding && !appearanceBranding) return;

    let styleTag = document.getElementById(BRAND_THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = BRAND_THEME_STYLE_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
  }, [css, platformBranding, appearanceBranding]);

  return null;
}
