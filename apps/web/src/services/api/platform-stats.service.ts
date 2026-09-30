import platformApi from "./platform-axios";
import type { PlatformStats } from "@/types/platform-stats.types";

export const platformStatsService = {
  async getStats(): Promise<PlatformStats> {
    const { data } = await platformApi.get<PlatformStats>("/stats");

    return data;
  },
};

/** Human-readable byte size, or null when the host did not report it. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined) return null;

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** Uptime as a short duration, or null when unavailable. */
export function formatUptime(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;

  return `${minutes} دقيقة`;
}