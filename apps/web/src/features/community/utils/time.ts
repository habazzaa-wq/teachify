/** Relative + calendar time formatting for chat messages (Arabic). */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Short clock time, e.g. "٣:٤٥ م". */
export function formatClock(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Day-of-week + clock, e.g. "الثلاثاء ٣:٤٥ م". */
export function formatWeekdayClock(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Full localized date, e.g. "٥ أغسطس ٢٠٢٦". */
export function formatFullDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const relativeFormatter = new Intl.RelativeTimeFormat("ar", {
  numeric: "auto",
});

/** Human friendly relative time, e.g. "قبل ٥ دقائق". */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = date.getTime() - now;
  const abs = Math.abs(diff);

  if (abs < 60_000) return relativeFormatter.format(Math.round(diff / 1000), "second");
  if (abs < HOUR) return relativeFormatter.format(Math.round(diff / 60_000), "minute");
  if (abs < DAY) return relativeFormatter.format(Math.round(diff / HOUR), "hour");

  const dateDiff = new Date(now).getDate() - date.getDate();
  if (Math.abs(dateDiff) === 1 && abs < DAY * 2) {
    return relativeFormatter.format(dateDiff, "day");
  }

  if (abs < DAY * 7) return relativeFormatter.format(Math.round(diff / DAY), "day");

  return formatFullDate(date);
}

/**
 * Compact timestamp for message bubbles:
 * - today → clock
 * - yesterday → "أمس"
 * - within 7 days → weekday
 * - otherwise → full date
 */
export function formatMessageTimestamp(
  value: string | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfValue = new Date(date);
  startOfValue.setHours(0, 0, 0, 0);

  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfValue.getTime()) / DAY,
  );

  if (dayDiff === 0) return formatClock(date);
  if (dayDiff === 1) return "أمس";
  if (dayDiff < 7) {
    return new Intl.DateTimeFormat("ar", { weekday: "long" }).format(date);
  }
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Absolute "title" tooltip timestamp. */
export function formatTooltip(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("ar") : "";
}
