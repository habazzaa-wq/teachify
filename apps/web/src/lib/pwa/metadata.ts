import type { Metadata } from "next";
import type { TenantSeoContext } from "@/lib/seo/tenant-context";
import { resolveAssetUrl } from "@/lib/seo/url";
import { getSiteName } from "@/lib/seo/metadata";
import { resolveManifestColor, pickTenantIconUrl } from "@/lib/pwa/manifest";

/**
 * Server-rendered PWA / iOS install metadata, merged into the root layout's
 * `generateMetadata`. Reuses the tenant context already resolved by the root
 * layout (no second tenant fetch) and the same icon/color resolution as the
 * web manifest so the two always agree.
 *
 * The existing `TenantDocumentMeta` component continues to manage the tenant
 * favicon client-side; we only add the install-focused metadata here (manifest,
 * theme-color, apple touch icon, iOS web-app tags), avoiding a conflicting
 * duplicate favicon declaration.
 */
export function buildPwaMetadata(
  tenant: TenantSeoContext | null,
  origin: string,
): Pick<Metadata, "manifest" | "themeColor" | "appleWebApp" | "icons"> {
  const siteName = getSiteName(tenant);
  const appleIcon = resolveAssetUrl(pickTenantIconUrl(tenant), origin);

  return {
    manifest: "/manifest.webmanifest",
    themeColor: resolveManifestColor(tenant?.branding?.primaryColor),
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    icons: appleIcon
      ? {
          apple: [{ url: appleIcon, sizes: "any" }],
        }
      : undefined,
  };
}
