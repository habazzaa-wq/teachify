/**
 * Shared brand-color resolution.
 *
 * The two platform brand colors (primary + secondary) are configured by the
 * teacher in site settings and applied at runtime as global CSS variables by
 * `BrandThemeProvider`. Components that need the colors as JS values (inline
 * styles / hex-with-alpha like `${primary}30`) resolve them through these
 * helpers so every usage stays dynamic.
 */

import { hexToRgb } from "@/lib/color";

export const BRAND_PRIMARY_DEFAULT = "#D87B63";
export const BRAND_SECONDARY_DEFAULT = "#FFB50E";

export function normalizeHex(hex: string): string {
  let clean = (hex ?? "").trim().replace("#", "");
  if (!clean) return hex;
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${clean.toUpperCase()}`;
}

export function resolveBrandHexColors(
  activeTenant?: { branding?: { primary_color?: string | null; secondary_color?: string | null } } | null,
  branding?: { primaryColor?: string | null; secondaryColor?: string | null } | null,
): { primary: string; secondary: string } {
  return {
    primary: normalizeHex(
      activeTenant?.branding?.primary_color ?? branding?.primaryColor ?? BRAND_PRIMARY_DEFAULT,
    ),
    secondary: normalizeHex(
      activeTenant?.branding?.secondary_color ?? branding?.secondaryColor ?? BRAND_SECONDARY_DEFAULT,
    ),
  };
}

/**
 * Alpha variant of a brand accent for inline styles. Accepts the solid brand
 * var reference (e.g. `var(--brand-primary)`) and returns the matching
 * `rgb(var(--brand-…-rgb) / a)` so dynamic accents keep their alpha.
 */
export function brandAlpha(accent: string, alpha: number): string {
  if (accent.startsWith("var(--brand-primary")) {
    return `rgb(var(--brand-primary-rgb) / ${alpha})`;
  }
  if (accent.startsWith("var(--brand-secondary")) {
    return `rgb(var(--brand-secondary-rgb) / ${alpha})`;
  }
  return accent;
}

/** Highest-contrast text color (white or near-black) for a given background hex. */
export function brandContrast(hex: string): string {
  const { r, g, b } = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#17130d" : "#ffffff";
}
