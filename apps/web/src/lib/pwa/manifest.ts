import type { MetadataRoute } from "next";
import type { TenantSeoContext } from "@/lib/seo/tenant-context";
import { resolveAssetUrl } from "@/lib/seo/url";
import { getSiteName } from "@/lib/seo/metadata";
import { BRAND_PRIMARY_DEFAULT, normalizeHex } from "@/lib/brand";

/**
 * PWA web-manifest constants that are invariant across every tenant. Both
 * `start_url` and `scope` stay on the tenant's current origin (the browser
 * resolves these against the document origin), so the installed PWA is always
 * launched on the tenant domain and never on a central platform URL.
 */
export const MANIFEST_LANG = "ar";
export const MANIFEST_DIR = "rtl";
export const MANIFEST_DISPLAY = "standalone";
export const MANIFEST_START_URL = "/";
export const MANIFEST_SCOPE = "/";

/** Maximum length (code points) for the manifest `short_name`. */
export const MANIFEST_SHORT_NAME_MAX = 12;

/** Manifest response content type. */
export const MANIFEST_CONTENT_TYPE = "application/manifest+json";

/**
 * The manifest is per-tenant and host-dependent, so it must never be cached
 * publicly (a shared/CDN cache must not serve Tenant B's manifest to Tenant A).
 * `no-store` guarantees the response is never held in any cache.
 */
export const MANIFEST_CACHE_CONTROL = "no-store";

/** Response headers that apply to the manifest route. */
export function manifestResponseHeaders(): Record<string, string> {
  return {
    "content-type": MANIFEST_CONTENT_TYPE,
    "cache-control": MANIFEST_CACHE_CONTROL,
  };
}

/**
 * Icon candidates in preference order. The tenant favicon is the best PWA icon
 * (square, self-contained), so it is preferred over the wide logo. `logoImage`
 * is the media-library image used by the navbar when configured; `logo` is the
 * generic logo. Dark/light variants are the last resort.
 */
const ICON_CANDIDATES: ReadonlyArray<keyof TenantSeoContext["branding"]> = [
  "favicon",
  "logoImage",
  "logo",
  "darkLogo",
  "lightLogo",
];

/**
 * Pick the tenant icon asset to advertise in the manifest. Returns the raw
 * (possibly relative / protocol-less) URL or `null` when no icon is configured.
 * The caller resolves it to an absolute URL with the request origin.
 */
export function pickTenantIconUrl(tenant: TenantSeoContext | null): string | null {
  for (const key of ICON_CANDIDATES) {
    const value = tenant?.branding?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Derive a sensible `short_name`. Truncates the tenant name to a bounded number
 * of code points so the launcher label stays compact without cutting mid multi-
 * byte character. Returns the full name when it already fits.
 */
export function getManifestShortName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return trimmed;
  return Array.from(trimmed).slice(0, MANIFEST_SHORT_NAME_MAX).join("").trimEnd();
}

/**
 * Origin-scoped manifest `id`. Including the tenant slug prevents accidental
 * PWA identity reuse between tenants on a shared codebase; the browser still
 * associates the identity with the tenant's own origin.
 */
export function getManifestId(tenant: TenantSeoContext | null): string {
  const slug = tenant?.slug?.trim();
  return slug ? `/?tenant=${encodeURIComponent(slug)}` : "/";
}

/** Resolve the theme color from tenant branding, falling back to the platform default. */
export function resolveManifestColor(color: string | null | undefined): string {
  return normalizeHex(color ?? BRAND_PRIMARY_DEFAULT);
}

export interface BuildManifestInput {
  tenant: TenantSeoContext | null;
  /** Current request origin (scheme + host), used to absolutize asset URLs. */
  origin: string;
}

/**
 * Build the tenant-aware PWA manifest. Pure (no request/headers access) so it
 * can be unit-tested while the running route handler stays host-dependent.
 *
 * The tenant name resolves through the repository's canonical `getSiteName`
 * helper, defaulting to the platform app name only when no tenant matches
 * (platform/local hosts) — never to another tenant's identity.
 */
export function buildManifest({ tenant, origin }: BuildManifestInput): MetadataRoute.Manifest {
  const name = getSiteName(tenant);
  const iconUrl = resolveAssetUrl(pickTenantIconUrl(tenant), origin);
  const themeColor = resolveManifestColor(tenant?.branding?.primaryColor);

  return {
    name,
    short_name: getManifestShortName(name),
    id: getManifestId(tenant),
    start_url: MANIFEST_START_URL,
    scope: MANIFEST_SCOPE,
    display: MANIFEST_DISPLAY,
    theme_color: themeColor,
    background_color: themeColor,
    lang: MANIFEST_LANG,
    dir: MANIFEST_DIR,
    icons: iconUrl
      ? [
          {
            src: iconUrl,
            // The chosen asset is usually the favicon (ico) or a vector/wide
            // logo whose exact raster dimensions are unknown. `sizes: "any"`
            // is the truthful declaration — we must not claim 192x192/512x512
            // for an asset whose dimensions we have not measured.
            sizes: "any",
          },
        ]
      : [],
  };
}
