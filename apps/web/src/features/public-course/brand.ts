/**
 * Shared brand tokens for the public course sales page.
 * Kept in one place so every section uses identical colors & gradients.
 */

export const PRIMARY = "var(--brand-primary)";
export const ACCENT = "var(--brand-secondary)";
export const PRIMARY_DARK = "var(--brand-primary-dark)";

/** Premium CTA gradient used on every subscribe button. */
export const CTA_GRADIENT = `linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))`;

/** Warm hero accent gradient used for badges, chips and highlights. */
export const ACCENT_GRADIENT = `linear-gradient(135deg, var(--brand-secondary), var(--brand-secondary-dark))`;

/** Locked-content banner gradient (terracotta → deep warm). */
export const LOCKED_GRADIENT = `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.12), rgb(var(--brand-secondary-rgb) / 0.06))`;

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
