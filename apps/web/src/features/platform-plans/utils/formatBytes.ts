/**
 * Plan storage/bandwidth/upload-size limits are stored in bytes, because that
 * is the unit the API compares against `tenant_usage.storage_bytes` /
 * `bandwidth_bytes`. Anything user-facing therefore has to convert, or a 1 GB
 * plan renders as "1073741824 GB".
 */
export const BYTES_PER_MB = 1024 ** 2;
export const BYTES_PER_GB = 1024 ** 3;

/** Format a byte count for display, keeping a readable unit. */
export function formatBytes(bytes: number): string {
  if (bytes >= BYTES_PER_GB) {
    const gb = bytes / BYTES_PER_GB;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(2)} GB`;
  }

  const mb = bytes / BYTES_PER_MB;

  return `${Number.isInteger(mb) ? mb : mb.toFixed(2)} MB`;
}
