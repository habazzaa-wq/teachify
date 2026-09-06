import type { Metadata } from "next";
import type { TenantSeoContext } from "@/lib/seo/tenant-context";
import { resolveAssetUrl } from "@/lib/seo/url";
import { getSiteName } from "@/lib/seo/metadata";
import { DEFAULT_PWA_ICON_PATH, pickTenantIconUrl } from "@/lib/pwa/manifest";

/**
 * Server-rendered PWA / iOS install metadata, merged into the root layout's
 * `generateMetadata`. Reuses the tenant context already resolved by the root
 * layout (no second tenant fetch) and the same icon/color resolution as the
 * web manifest so the two always agree.
 *
 * The existing `TenantDocumentMeta` component continues to manage the tenant
 * favicon client-side; we only add the install-focused metadata here (manifest,
 * apple touch icon, iOS web-app tags), avoiding a conflicting duplicate favicon
 * declaration. theme-color is emitted via the layout's `generateViewport`
 * (moved out of Metadata in Next 16), still resolved by `resolveManifestColor`.
 */
export function buildPwaMetadata(
  tenant: TenantSeoContext | null,
  origin: string,
): Pick<Metadata, "manifest" | "appleWebApp" | "icons"> {
  const siteName = getSiteName(tenant);
  // The fallback ensures a non-empty asset, so the result is never null.
  const appleIcon = resolveAssetUrl(
    pickTenantIconUrl(tenant) ?? DEFAULT_PWA_ICON_PATH,
    origin,
  )!;

  return {
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    icons: {
      apple: [{ url: appleIcon, sizes: "any" }],
    },
  };
}
