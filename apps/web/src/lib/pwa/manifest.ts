import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { toAbsoluteAssetUrl } from "@/lib/url";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";
import { env } from "@/config/env";

export interface WebAppManifestIcon {
  src: string;
  sizes: string;
  type: string;
}

export interface WebAppManifest {
  name: string;
  short_name: string;
  id: string;
  start_url: string;
  scope: string;
  display: "standalone";
  theme_color: string;
  background_color: string;
  lang: string;
  dir: string;
  icons: WebAppManifestIcon[];
}

export const MANIFEST_CACHE_CONTROL = "no-store";

export const MANIFEST_CONTENT_TYPE = "application/manifest+json; charset=utf-8";

const DEFAULT_THEME_COLOR = "#ffffff";

/**
 * Fallback manifest used for platform hosts (base domain, localhost, etc.)
 * where no customer tenant resolves. Uses only platform identity, never a
 * customer tenant's branding.
 */
export function buildPlatformManifest(appName: string): WebAppManifest {
  return {
    name: appName,
    short_name: appName,
    id: "/?tenant=platform",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: DEFAULT_THEME_COLOR,
    background_color: DEFAULT_THEME_COLOR,
    lang: "ar",
    dir: "rtl",
    icons: [],
  };
}

export interface ManifestResponse {
  body: WebAppManifest;
  headers: Record<string, string>;
}

/**
 * Build the final manifest body and response headers for the HTTP route.
 * Guarantees `Cache-Control: no-store` so a CDN/shared cache can never serve
 * one tenant's manifest to another.
 */
export async function buildManifestResponse(): Promise<ManifestResponse> {
  const manifest = (await buildTenantManifest()) ?? buildPlatformManifest(env.appName);

  return {
    body: manifest,
    headers: {
      "Content-Type": MANIFEST_CONTENT_TYPE,
      "Cache-Control": MANIFEST_CACHE_CONTROL,
    },
  };
}

export function iconTypeForUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

function resolveIconUrl(tenant: TenantByDomainResponse): string | null {
  return (
    toAbsoluteAssetUrl(tenant.branding.favicon) ||
    toAbsoluteAssetUrl(tenant.branding.lightLogo) ||
    toAbsoluteAssetUrl(tenant.branding.darkLogo) ||
    toAbsoluteAssetUrl(tenant.branding.logo) ||
    null
  );
}

function truncateShortName(name: string): string {
  if (name.length <= 12) return name.trim();
  return name.slice(0, 12).trim();
}

/**
 * Build a tenant-aware Web App Manifest.
 *
 * Uses the same server-side tenant resolution as the rest of the application.
 * For platform hosts (localhost, base domain) returns null so the caller can
 * decide whether to emit a fallback manifest.
 */
export async function buildTenantManifest(): Promise<WebAppManifest | null> {
  const tenant = await getTenantSeoContext();
  if (!tenant) return null;

  const themeColor = tenant.branding.primaryColor || DEFAULT_THEME_COLOR;
  const iconUrl = resolveIconUrl(tenant);

  const manifest: WebAppManifest = {
    name: tenant.name,
    short_name: truncateShortName(tenant.name),
    id: `/?tenant=${tenant.slug}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: themeColor,
    background_color: themeColor,
    lang: "ar",
    dir: "rtl",
    // The exact pixel dimensions of the tenant's favicon are not known, so we
    // deliberately avoid asserting an incorrect `sizes` value rather than
    // claiming a wide logo is a true 192x192/512x512 asset. Each tenant keeps
    // its own branded icon, resolved from tenant branding.
    icons: iconUrl
      ? [
          { src: iconUrl, sizes: "any", type: iconTypeForUrl(iconUrl) },
        ]
      : [],
  };

  return manifest;
}
