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
