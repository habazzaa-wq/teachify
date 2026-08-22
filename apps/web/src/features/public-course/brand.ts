/**
 * Shared brand tokens for the public course sales page.
 * Kept in one place so every section uses identical colors & gradients.
 */

export const PRIMARY = "#BF6D58";
export const ACCENT = "#FFB50E";
export const PRIMARY_DARK = "#a85a47";

/** Premium CTA gradient used on every subscribe button. */
export const CTA_GRADIENT = `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`;

/** Warm hero accent gradient used for badges, chips and highlights. */
export const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT}, #f59e0b)`;

/** Locked-content banner gradient (terracotta → deep warm). */
export const LOCKED_GRADIENT = `linear-gradient(135deg, rgba(191,109,88,0.12), rgba(255,181,14,0.06))`;

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
  all_levels: PRIMARY,
};

export const LANGUAGE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
};
