/** Format an exam duration in minutes into a compact Arabic string. */
export function formatExamDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} ساعة و ${rem} دقيقة` : `${hours} ساعة`;
  }
  return `${minutes} دقيقة`;
}

/** Format a 0-100 percentage score, trimming trailing zeros. */
export function formatExamPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}٪`;
}
