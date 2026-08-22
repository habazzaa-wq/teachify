import type { Metadata } from "next";
import { env } from "@/config/env";
import { resolveAssetUrl } from "./url";
import type { TenantSeoContext } from "./tenant-context";
import type { TenantSeoRobotsPolicy } from "@/features/tenant-bootstrap/types";

export const SITE_DEFAULT_DESCRIPTION =
  "منصة تعليمية متكاملة للتعلم عن بُعد — دورات ومحتوى تعليمي عالي الجودة للمراحل الدراسية المختلفة";

export function getSiteName(tenant: TenantSeoContext | null): string {
  return tenant?.name?.trim() || env.appName;
}

export function getSiteTitleTemplate(tenant: TenantSeoContext | null): string | null {
  return tenant?.seo?.titleTemplate?.trim() || null;
}

export function getSiteDescription(
  tenant: TenantSeoContext | null,
  fallback: string = SITE_DEFAULT_DESCRIPTION,
): string {
  return tenant?.seo?.description?.trim() || fallback;
}

export function getHomepageTitle(tenant: TenantSeoContext | null): string | null {
  return tenant?.seo?.homepageTitle?.trim() || null;
}

export function getHomepageDescription(
  tenant: TenantSeoContext | null,
  fallback: string = SITE_DEFAULT_DESCRIPTION,
): string {
  return tenant?.seo?.homepageDescription?.trim() || fallback;
}

export function getOrganizationName(tenant: TenantSeoContext | null): string {
  return tenant?.seo?.organizationName?.trim() || getSiteName(tenant);
}

export function getOrganizationDescription(tenant: TenantSeoContext | null): string | null {
  return tenant?.seo?.organizationDescription?.trim() || tenant?.seo?.description?.trim() || null;
}

/** Clean list of social profile URLs for `sameAs` in Organization JSON-LD. */
export function getSocialProfiles(tenant: TenantSeoContext | null): string[] {
  return (tenant?.seo?.socialProfiles ?? []).filter(
    (profile) => typeof profile === "string" && profile.trim().length > 0,
  );
}

export function getRobotsPolicy(tenant: TenantSeoContext | null): TenantSeoRobotsPolicy | null {
  return tenant?.seo?.robotsPolicy ?? null;
}

/**
 * Map a saved robots policy value to the Next.js `robots` metadata object.
 *
 * - `index` / `index_follow` → allow indexing and link-following (default)
 * - `noindex` / `noindex_nofollow` → block indexing and link-following
 */
export function robotsRulesForPolicy(
  policy: TenantSeoRobotsPolicy | null | undefined,
): NonNullable<Metadata["robots"]> {
  switch (policy) {
    case "noindex":
    case "noindex_nofollow":
      return { index: false, follow: false };
    case "index":
    case "index_follow":
    default:
      return { index: true, follow: true };
  }
}

export interface VerificationTokens {
  google?: string;
  bing?: string;
}

/**
 * Search-engine verification tokens. Tenant-provided tokens win over the
 * platform defaults so every tenant domain can be verified independently in
 * Google Search Console / Bing Webmaster Tools without affecting others.
 */
export function getVerificationTokens(tenant: TenantSeoContext | null): VerificationTokens {
  const google =
    tenant?.seo?.googleVerification?.trim() ||
    process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim() ||
    undefined;
  const bing =
    tenant?.seo?.bingVerification?.trim() ||
    process.env.NEXT_PUBLIC_BING_VERIFICATION?.trim() ||
    undefined;
  return { google, bing };
}

export interface SeoMetadataInput {
  /** Page title. A plain string uses the root layout template (`%s | Site`). */
  title: Metadata["title"];
  description?: string | null;
  keywords?: string[];
  canonical: string;
  ogImage?: string | null;
  ogImageAlt?: string | null;
  /** Private pages: set `noindex` to emit `noindex, nofollow` + drop canonical. */
  noindex?: boolean;
}

/**
 * Consistent metadata builder shared by public pages: canonical, OpenGraph,
 * Twitter, robots, and search-engine verification, all tenant-aware (site
 * name, default logo, verification tokens).
 */
export function buildSeoMetadata(
  input: SeoMetadataInput,
  tenant: TenantSeoContext | null,
  origin: string,
): Metadata {
  const siteName = getSiteName(tenant);
  const titleString = typeof input.title === "string" ? input.title : siteName;
  const description = input.description?.trim() || undefined;
  const ogImage = resolveAssetUrl(
    input.ogImage ?? tenant?.seo?.ogImage ?? tenant?.branding?.logo ?? null,
    origin,
  );
  const twitterImage = resolveAssetUrl(tenant?.seo?.twitterImage ?? ogImage, origin);
  const verification = getVerificationTokens(tenant);

  return {
    title: input.title,
    ...(description ? { description } : {}),
    ...(input.keywords && input.keywords.length ? { keywords: input.keywords } : {}),
    alternates: input.noindex ? undefined : { canonical: input.canonical },
    robots: input.noindex
      ? { index: false, follow: false }
      : robotsRulesForPolicy(getRobotsPolicy(tenant)),
    ...(verification.google || verification.bing
      ? {
          verification: {
            ...(verification.google ? { google: verification.google } : {}),
            ...(verification.bing
              ? { other: { "msvalidate.01": verification.bing } }
              : {}),
          },
        }
      : {}),
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName,
      title: titleString,
      ...(description ? { description } : {}),
      url: input.canonical,
      ...(ogImage
        ? { images: [{ url: ogImage, alt: input.ogImageAlt ?? titleString, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: twitterImage ? "summary_large_image" : "summary",
      title: titleString,
      ...(description ? { description } : {}),
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
  };
}
