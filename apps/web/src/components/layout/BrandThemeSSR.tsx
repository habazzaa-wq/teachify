import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  resolveBrandThemeColors,
  resolveDashboardBrandColors,
} from "@/lib/brand-theme";

/**
 * Server-rendered brand theme. Renders BOTH palettes as a real <style> block
 * in <head> so the first paint already uses the configured colors:
 *  · tenant.platform_branding  → public site (--brand-*, .community-theme)
 *  · tenant.branding           → dashboards (.tenant-theme / .student-theme)
 *
 * The two are never mixed: each selector only receives its own palette. The
 * client `BrandThemeProvider` reuses the same <style> id to update the block in
 * place when either palette changes live, so there is never a duplicate node.
 */
export async function BrandThemeSSR() {
  const tenant = await getTenantSeoContext();
  const branding = tenant?.platform_branding ?? tenant?.platformBranding ?? null;
  const platform = resolveBrandThemeColors(branding);
  // by-domain carries the teacher's "مظهر لوحة التحكم" palette in `branding`.
  // It falls back to dashboard defaults, never to the public-site pair.
  const dashboard = resolveDashboardBrandColors(tenant?.branding);
  const css = buildBrandThemeCss(platform.primary, platform.secondary, dashboard);

  return <style id={BRAND_THEME_STYLE_ID} data-ssr="true">{css}</style>;
}
