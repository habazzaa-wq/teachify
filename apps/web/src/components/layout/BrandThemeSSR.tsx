import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  resolveBrandThemeColors,
} from "@/lib/brand-theme";

/**
 * Server-rendered brand theme. Renders the tenant's resolved `platform_branding`
 * as a real <style> block directly into <head>, so the browser's very first
 * paint already uses the tenant's configured colors — eliminating the
 * flash-of-unstyled-content where the globals.css fallbacks
 * (#D87B63 / #FFB50E) flashed for a moment before the client fetched branding.
 *
 * For tenant hosts the tenant is resolved server-side (via the
 * `x-tenant-context` header or an internal by-domain call, both cached per
 * request by `getTenantSeoContext`). On the bare platform host there is no
 * tenant, so the platform's design fallbacks render — which is correct and
 * stable (no color "change" after load).
 *
 * The client `BrandThemeProvider` reuses the exact same <style> id to update
 * the block in place when live branding changes (dashboard save / tenant
 * switch), so there is never a duplicate stylesheet node.
 */
export async function BrandThemeSSR() {
  const tenant = await getTenantSeoContext();
  const branding = tenant?.platform_branding ?? tenant?.platformBranding ?? null;
  const { primary, secondary } = resolveBrandThemeColors(branding);
  const css = buildBrandThemeCss(primary, secondary);

  return <style id={BRAND_THEME_STYLE_ID} data-ssr="true">{css}</style>;
}