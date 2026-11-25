const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const STORAGE_ROOT = "/storage";
const MEDIA_PROXY_PREFIX = "/api/v1/media/serve";

/**
 * Rewrite a local Laravel storage URL to the same-origin media proxy.
 *
 * Older uploads were saved with an absolute `APP_URL` host such as
 * `https://teachify.tech/storage/tenants/28/assets/logo.png`. On a tenant
 * domain that host is wrong, and the central `/storage/` path can be blocked
 * by the reverse proxy. `GET /api/v1/media/serve/{path}` already resolves the
 * tenant and streams the same bytes, so every browser can load it.
 */
function proxyPathForStorageUrl(value: string): string | null {
  const candidate = value.startsWith("//") ? `https:${value}` : value;

  try {
    const parsed = new URL(candidate, "https://asset.invalid");
    if (
      parsed.pathname !== STORAGE_ROOT &&
      !parsed.pathname.startsWith(`${STORAGE_ROOT}/`)
    ) {
      return null;
    }

    return `${MEDIA_PROXY_PREFIX}${parsed.pathname.slice(STORAGE_ROOT.length)}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/**
 * True for same-origin media-proxy URLs that must bypass the Next.js image
 * optimizer. On tenant domains the optimizer cannot fetch these local paths
 * (it returns 400 "The requested resource isn't a valid image"), while the
 * browser can load the proxy URL directly.
 */
export function isLocalMediaProxyUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed === MEDIA_PROXY_PREFIX || trimmed.startsWith(`${MEDIA_PROXY_PREFIX}/`)
  );
}

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

  const storageProxy =
    proxyPathForStorageUrl(trimmed) ??
    (!ABSOLUTE_SCHEME.test(trimmed) &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/")
      ? proxyPathForStorageUrl(`https://${trimmed}`)
      : null);
  if (storageProxy) return storageProxy;

  if (ABSOLUTE_SCHEME.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return trimmed;

  return `https://${trimmed}`;
}
