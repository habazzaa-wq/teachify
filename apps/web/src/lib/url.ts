const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Normalize a possibly protocol-less asset URL into something <img> and
 * next/image can always load. A bare hostname like
 * `cdn.example.com/file.jpg` would otherwise be resolved by the browser
 * relative to the current origin and silently 404.
 */
export function toAbsoluteAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_SCHEME.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return trimmed;

  return `https://${trimmed}`;
}
