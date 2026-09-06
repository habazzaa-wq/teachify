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
export function buildBrandThemeCss(primary: string, secondary: string): string {
  const light = {
    ...generateCommunityThemeColors(primary, secondary, false),
    ...generateBrandScale(primary, secondary, false),
  };
  const dark = {
    ...generateCommunityThemeColors(primary, secondary, true),
    ...generateBrandScale(primary, secondary, true),
  };
  const dashLight = generateThemeColors(primary, secondary, false);
  const dashDark = generateThemeColors(primary, secondary, true);

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