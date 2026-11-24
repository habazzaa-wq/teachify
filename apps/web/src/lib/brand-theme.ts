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

/** Class put on <body> for dashboard routes so portals (dialogs, dropdowns,
 * toasts mounted outside the themed wrapper) also inherit the dashboard
 * palette instead of the public-site palette. */
export const DASHBOARD_THEME_BODY_CLASS = "dashboard-theme";

/** Every logged-in control-panel surface that follows "الألوان المخصصة". */
export const DASHBOARD_THEME_PATH_PREFIXES = [
  "/teacher",
  "/instructor",
  "/tenant-login",
  "/student",
] as const;

export function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_THEME_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Resolve the two PUBLIC site colors from a tenant's `platform_branding`
 * payload (ألوان الموقع). Accepts both the camelCase shape returned by the
 * public by-domain endpoint (`primaryColor`/`secondaryColor`) and the
 * snake_case shape used by auth responses (`primary_color`/`secondary_color`).
 * Unset values fall back to the platform defaults (#D87B63 / #FFB50E).
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
 * Resolve the DASHBOARD palette (الألوان المخصصة), saved in the `branding`
 * settings group and driven by the teacher/admin appearance editor.
 *
 * Deliberately falls back to the *dashboard defaults*, never to the public
 * platform pair: a tenant that never configured its dashboards must not
 * inherit the colors chosen for the public website.
 * Accepts both camelCase (by-domain) and snake_case (auth/bootstrap) shapes.
 */
export function resolveDashboardBrandColors(
  branding?: unknown,
  fallback: { primary: string; secondary: string } = {
    primary: BRAND_PRIMARY_DEFAULT,
    secondary: BRAND_SECONDARY_DEFAULT,
  },
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
 * The full brand-theme stylesheet, generated from TWO independent palettes:
 *
 *  · `primary`/`secondary` (platform_branding, "ألوان الموقع") → :root,
 *    .dark, .community-theme and all `--brand-*` raw tokens = public site only.
 *  · `dashboard` (tenant_settings.branding, "الألوان المخصصة") → .tenant-theme,
 *    .student-theme and `body.dashboard-theme` = dashboards only.
 *
 * Nothing from one palette is emitted into the other palette's selectors, so
 * editing either settings page can no longer recolor the opposite surface.
 * The `body` scopes cover portals mounted outside a themed wrapper; `:has()`
 * keeps them correct even before the client adds the explicit route class.
 *
 * Both sides use this same function: server (`BrandThemeSSR`) pre-renders the
 * colors into <head> for the first paint, client (`BrandThemeProvider`) rewrites
 * the same <style> element when either palette changes live.
 */
export function buildBrandThemeCss(
  primary: string,
  secondary: string,
  dashboard: { primary: string; secondary: string } = { primary, secondary },
): string {
  const publicLight = {
    ...generateCommunityThemeColors(primary, secondary, false),
    ...generateBrandScale(primary, secondary, false),
  };
  const publicDark = {
    ...generateCommunityThemeColors(primary, secondary, true),
    ...generateBrandScale(primary, secondary, true),
  };
  const dashLight = generateThemeColors(dashboard.primary, dashboard.secondary, false);
  const dashDark = generateThemeColors(dashboard.primary, dashboard.secondary, true);

  const dashboardScopes = `body.${DASHBOARD_THEME_BODY_CLASS}, body:has(.tenant-theme), body:has(.student-theme)`;
  const dashboardScopesDark = `html.dark body.${DASHBOARD_THEME_BODY_CLASS}, html.dark body:has(.tenant-theme), html.dark body:has(.student-theme)`;

  return `
:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-primary-contrast: ${brandContrast(primary)};
  --brand-secondary-contrast: ${brandContrast(secondary)};
  ${toVars(publicLight)}
}
.dark { ${toVars(publicDark)} }
.community-theme { ${toVars(publicLight)} }
.dark .community-theme, .dark.community-theme { ${toVars(publicDark)} }
.tenant-theme { ${toVars(dashLight)} }
.dark .tenant-theme, .dark.tenant-theme { ${toVars(dashDark)} }
.student-theme { ${toVars(dashLight)} }
.dark .student-theme, .dark.student-theme { ${toVars(dashDark)} }
${dashboardScopes} { ${toVars(dashLight)} }
${dashboardScopesDark} { ${toVars(dashDark)} }
`;
}
