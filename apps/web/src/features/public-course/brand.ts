/**
 * Shared brand tokens for the public course sales page.
 * Kept in one place so every section uses identical colors & gradients.
 */

export const PRIMARY = "var(--brand-primary)";
export const ACCENT = "var(--brand-secondary)";

/** Premium CTA background used on every subscribe button. */
export const CTA_GRADIENT = `var(--brand-primary)`;

/** Warm hero accent background used for badges, chips and highlights. */
export const ACCENT_GRADIENT = `var(--brand-secondary)`;

/** Locked-content banner background. */
export const LOCKED_GRADIENT = `var(--brand-primary)`;

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
