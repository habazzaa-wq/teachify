import { headers } from "next/headers";

const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Query params that add no SEO value and should never appear in canonicals.
 * Filtering UI state (page, stage, subject, teacher, ...) is also intentionally
 * left off public page canonicals — list pages canonicalize to their clean URL.
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "yclid",
  "igshid",
  "ref",
  "source",
]);

function stripTrailingSlash(path: string): string {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

/** Absolute origin of the current request (scheme + host), for canonical URLs. */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const rawHost = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim() ?? "";
  const host = rawHost || "localhost";
  const protocol = h.get("x-forwarded-proto") ?? (host === "localhost" ? "http" : "https");
  return `${protocol}://${host}`;
}

/** Join an origin and a root-relative path into an absolute URL. */
export function absoluteUrl(origin: string, path: string): string {
  const normalized = stripTrailingSlash(path.startsWith("/") ? path : `/${path}`);
  return new URL(normalized, origin).toString();
}

/**
 * Canonical URL for a path. Tracking params are dropped; a whitelist of
 * semantic params (e.g. paged listings) can be preserved via `searchParams`.
 */
export function canonicalUrl(
  origin: string,
  path: string,
  searchParams?: Record<string, string | undefined>,
): string {
  const url = new URL(stripTrailingSlash(path.startsWith("/") ? path : `/${path}`), origin);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (TRACKING_PARAMS.has(key)) continue;
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Normalize a possibly protocol-less / root-relative asset URL into an
 * absolute URL suitable for OG/Twitter images and structured data.
 */
export function resolveAssetUrl(
  url: string | null | undefined,
  origin: string,
): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_SCHEME.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return new URL(trimmed, origin).toString();

  return `https://${trimmed}`;
}
