/** Format a percentage number, trimming trailing zeros (e.g. 100, 66.7). */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Format a duration in seconds as "X دقيقة و Y ثانية" (or just seconds/minutes). */
export function formatDurationLabel(totalSeconds: number | null | undefined): string | null {
  if (totalSeconds === null || totalSeconds === undefined) {
    return null;
  }

  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes > 0) {
    return remainder > 0
      ? `${minutes} دقيقة و ${remainder} ثانية`
      : `${minutes} دقيقة`;
  }

  return `${seconds} ثانية`;
}

/** Format seconds-per-question as a compact label (e.g. "45 ث/سؤال"). */
export function formatSecondsPerQuestion(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return null;
  }

  return `${Math.round(seconds)} ث/سؤال`;
}
