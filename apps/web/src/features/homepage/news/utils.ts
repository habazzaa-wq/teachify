import { hexToRgb } from "@/lib/color";
import { DEFAULT_TICKER, type TickerConfig } from "./types";

interface BrandingColors {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
}

const FALLBACK_PRIMARY = "#4F46E5";
const FALLBACK_SECONDARY = "#F1F5F9";

export function contrastText(hex: string | null | undefined): string {
  if (!hex) return "#ffffff";
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  // Relative luminance (sRGB approximation)
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

/** Mix a hex color toward black by `amount` (0..1) to create a darker shade. */
export function darkenHex(hex: string | null | undefined, amount = 0.2): string {
  const rgb = hexToRgb(hex ?? "");
  if (!rgb) return "#000000";
  const f = 1 - amount;
  const toHex = (v: number) =>
    Math.round(v * f).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export interface ResolvedTicker {
  config: TickerConfig;
  bg: string;
  text: string;
  accent: string;
}

export function resolveTicker(
  config: Partial<TickerConfig> | undefined,
  branding?: BrandingColors | null,
): ResolvedTicker {
  const merged: TickerConfig = { ...DEFAULT_TICKER, ...(config ?? {}) };

  const primary = branding?.primary_color ?? FALLBACK_PRIMARY;
  const secondary = branding?.secondary_color ?? FALLBACK_SECONDARY;
  const accent = branding?.accent_color ?? secondary;

  const bg = merged.bgColor || primary;
  const accentResolved = merged.accentColor || accent;
  const text = merged.textColor || contrastText(bg);

  return {
    config: merged,
    bg,
    text,
    accent: accentResolved,
  };
}
