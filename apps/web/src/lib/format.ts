/**
 * Shared formatting helpers (RTL/Arabic-aware).
 */

/** Format an ISO date string into a localized Arabic date. */
export function formatDate(
  value: string | Date | null | undefined,
  locale = "ar",
): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Format an ISO date string into a localized Arabic date + time. */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale = "ar",
): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Format a number with locale-aware grouping. */
export function formatNumber(value: number, locale = "ar"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Format an amount in EGP (جنيه) with locale-aware grouping. */
export function formatCurrency(
  value: number | string | null | undefined,
  locale = "ar",
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0 جنيه";
  }

  const amount = Number(value);
  const rounded = Number.isInteger(amount) ? amount : amount;

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(rounded)} جنيه`;
}

/** Format a recharge code for display (XXXXX-XXXXX). */
export function formatRechargeCode(code: string | null | undefined): string {
  if (!code) return "";
  const normalized = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (normalized.length <= 5) return normalized;
  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
}

/** Produce initials from a display name (max 2 characters). */
export function initialsOf(name: string | null | undefined): string {
  if (!name) {
    return "؟";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "؟";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2);
  }

  return `${parts[0]![0]}${parts[1]![0]}`;
}
