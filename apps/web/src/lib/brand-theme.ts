import type { TenantBranding } from "@/features/tenant-bootstrap/types";
import {
  brandContrast,
  BRAND_PRIMARY_DEFAULT,
  BRAND_SECONDARY_DEFAULT,
  normalizeHex,
} from "@/lib/brand";

/**
 * Single <style> element both sides target so server-pre-rendered branding is
 * reused (never duplicated) by the client when live branding changes.
 */
export const BRAND_THEME_STYLE_ID = "brand-theme-vars";
import {
  generateBrandScale,
  generateCommunityThemeColors,
  generateThemeColors,
} from "@/lib/color";

/**
 * Resolve the two platform brand colors from a tenant's `platform_branding`
 * payload. Accepts both the camelCase shape returned by the public by-domain
 * endpoint (`primaryColor`/`secondaryColor`) and the snake_case shape used by
 * auth responses (`primary_color`/`secondary_color`). Unset values fall back to
 * the platform defaults (`#D87B63` / `#FFB50E`) and every value is normalized
 * to `#RRGGBB`, so consumers can rely on a well-formed hex pair.
 */
export function resolveBrandThemeColors(
  branding?: TenantBranding | null,
): { primary: string; secondary: string } {
  const b = (branding ?? {}) as Record<string, unknown>;
  const primary = (b.primaryColor ?? b.primary_color ?? BRAND_PRIMARY_DEFAULT) as string;
  const secondary = (b.secondaryColor ?? b.secondary_color ?? BRAND_SECONDARY_DEFAULT) as string;
  return {
    primary: normalizeHex(primary),
    secondary: normalizeHex(secondary),
  };
}

/**
 * The teacher dashboard has its own appearance palette (`branding` settings
 * group, saved from "مظهر لوحة التحكم"), kept separate from the public-site
 * palette (`platform_branding`). Use it for `.tenant-theme` when configured and
 * fall back to the platform pair on fresh tenants that never touched it.
 * Accepts both camelCase (by-domain) and snake_case (auth/bootstrap) shapes.
 */
export function resolveDashboardBrandColors(
  branding: unknown,
  fallback: { primary: string; secondary: string },
): { primary: string; secondary: string } {
  const b = (branding ?? {}) as Record<string, unknown>;
  const rawPrimary = b.primaryColor ?? b.primary_color;
  const rawSecondary = b.secondaryColor ?? b.secondary_color;
  return {
    primary:
      typeof rawPrimary === "string" && rawPrimary.trim()
        ? normalizeHex(rawPrimary)
        : fallback.primary,
    secondary:
      typeof rawSecondary === "string" && rawSecondary.trim()
        ? normalizeHex(rawSecondary)
        : fallback.secondary,
  };
}

function toVars(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v};`)
    .join("");
}

/**
 * The full brand-theme stylesheet: the `:root` brand pair plus the light/dark
 * variables for every brand surface (`.community-theme` / `.tenant-theme` /
 * `.student-theme`). It is generated from the tenant's two base colors so the
 * entire design system follows the tenant's branding.
 *
 * Both sides use this same function:
 *  · Server (`BrandThemeSSR`) pre-renders the real colors into <head>, so the
 *    very first paint already uses the tenant's colors and there is never a
 *    flash of the `globals.css` fallbacks (#D87B63 / #FFB50E).
 *  · Client (`BrandThemeProvider`) re-applies the same stylesheet whenever the
 *    live `platformBranding` changes (dashboard save, tenant switch) by
 *    rewriting the same <style> element in place.
 */
export function buildBrandThemeCss(
  primary: string,
  secondary: string,
  dashboard: { primary: string; secondary: string } = { primary, secondary },
): string {
  const light = {
    ...generateCommunityThemeColors(primary, secondary, false),
    ...generateBrandScale(primary, secondary, false),
  };
  const dark = {
    ...generateCommunityThemeColors(primary, secondary, true),
    ...generateBrandScale(primary, secondary, true),
  };
  // Dashboard (sidebar, header, active/hover states) follows the palette the
  // teacher picked in "مظهر لوحة التحكم"; the public site keeps the platform
  // palette above.
  const dashLight = generateThemeColors(dashboard.primary, dashboard.secondary, false);
  const dashDark = generateThemeColors(dashboard.primary, dashboard.secondary, true);

  return `
:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-primary-contrast: ${brandContrast(primary)};
  --brand-secondary-contrast: ${brandContrast(secondary)};
}
.community-theme { ${toVars(light)} }
.dark .community-theme, .dark.community-theme { ${toVars(dark)} }
.tenant-theme { ${toVars(dashLight)} }
.dark .tenant-theme, .dark.tenant-theme { ${toVars(dashDark)} }
.student-theme { ${toVars(dashLight)} }
.dark .student-theme, .dark.student-theme { ${toVars(dashDark)} }
`;
}