export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "—";
  if (bytesPerSecond >= 1_000_000_000) return `${(bytesPerSecond / 1_000_000_000).toFixed(2)} GB/s`;
  if (bytesPerSecond >= 1_000_000) return `${(bytesPerSecond / 1_000_000).toFixed(1)} MB/s`;
  if (bytesPerSecond >= 1_000) return `${(bytesPerSecond / 1_000).toFixed(0)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
}

export function formatETA(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 1) return "لحظات";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}س ${m}د`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

/** Countdown label for an automatic retry scheduled at `retryAt` (epoch ms). */
export function formatCountdown(retryAt: number | null, now: number): string {
  if (!retryAt) return "";
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  if (remaining <= 0) return "الآن";
  return `${remaining}ث`;
}
