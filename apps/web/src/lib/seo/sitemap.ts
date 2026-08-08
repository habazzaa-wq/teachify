import { canonicalUrl } from "./url";

/**
 * Maximum URLs per sitemap file. Google's hard limit is 50,000 URLs / 50 MB
 * per sitemap; we keep chunks far below it so the whole catalog (10k–500k+
 * courses) can be served through a sitemap index without any code change.
 */
export const SITEMAP_COURSES_PER_PAGE = 100;

/** Keep the ordering identical to the public catalog's default sort. */
export const SITEMAP_MAX_URLS_PER_FILE = 50_000;

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  lastModified?: string | null;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
}

/** Escape a string for safe inclusion in XML text/attribute content. */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateToIso(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Render a single <url> element (skips invalid/empty dates). */
export function entryToXml(entry: SitemapEntry): string {
  const lastModified = entry.lastModified ? dateToIso(entry.lastModified) : "";

  const parts: string[] = [`    <loc>${xmlEscape(entry.url)}</loc>`];
  if (lastModified) parts.push(`    <lastmod>${xmlEscape(lastModified)}</lastmod>`);
  if (entry.changeFrequency) {
    parts.push(`    <changefreq>${xmlEscape(entry.changeFrequency)}</changefreq>`);
  }
  if (typeof entry.priority === "number" && entry.priority >= 0 && entry.priority <= 1) {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }

  return ["  <url>", ...parts, "  </url>"].join("\n");
}

/** Build a complete <urlset> document from entries. */
export function buildUrlsetXml(entries: SitemapEntry[]): string {
  const body = entries.length
    ? entries.map(entryToXml).join("\n")
    : '  <url><loc>about:blank</loc></url>';
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

/**
 * Build a <sitemapindex> document. Each `location` must be the absolute URL of
 * a child sitemap (same tenant origin — never cross-tenant).
 */
export function buildSitemapIndexXml(locations: string[]): string {
  const body = locations
    .map(
      (loc) => `  <sitemap>
    <loc>${xmlEscape(loc)}</loc>
  </sitemap>`,
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</sitemapindex>",
    "",
  ].join("\n");
}

/**
 * XML response headers for sitemap route handlers. No `noindex`, no caching
 * surprises: the document is always regenerated per request so the tenant
 * origin embedded in every URL can never leak across tenants.
 */
export function sitemapXmlHeaders(): Record<string, string> {
  return {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
  };
}

/** Absolute sitemap path for a course catalog chunk (1-indexed). */
export function courseSitemapPath(page: number): string {
  return `/sitemap-courses/${page}`;
}

/** Convenience: a stable canonical URL entry for a public path. */
export function publicEntry(
  origin: string,
  path: string,
  options: Omit<SitemapEntry, "url"> = {},
): SitemapEntry {
  return { url: canonicalUrl(origin, path), ...options };
}
