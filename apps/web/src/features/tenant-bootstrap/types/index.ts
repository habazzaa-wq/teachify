export interface TenantBranding {
  logo: string | null;
  favicon: string | null;
  name?: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  font: string | null;
  darkLogo: string | null;
  lightLogo: string | null;
  /** "icon" | "image" | null — how the navbar logo should be rendered. */
  logoType?: string | null;
  /** Icon key from the built-in icon library when logoType === "icon". */
  logoIcon?: string | null;
  /** Media-library image URL when logoType === "image". */
  logoImage?: string | null;
}

/** Robots meta policy values saved in the SEO settings (`default_robots_policy`). */
export type TenantSeoRobotsPolicy = "index" | "noindex" | "index_follow" | "noindex_nofollow";

/**
 * Tenant-level SEO configuration. All fields are optional so the server-side
 * fallbacks (platform env vars / brand defaults) apply until a tenant provides
 * its own values. Never invent data that the tenant did not configure.
 */
export interface TenantSeoConfig {
  /** Default meta description used when a page has none of its own. */
  description?: string | null;
  /** Google Search Console verification token for this tenant domain. */
  googleVerification?: string | null;
  /** Bing Webmaster (msvalidate.01) verification token for this tenant domain. */
  bingVerification?: string | null;
  /** Default OpenGraph image (absolute or root-relative URL). */
  ogImage?: string | null;
  /** Optional `%s`-style title template (falls back to `%s | <site name>`). */
  titleTemplate?: string | null;
  /** Saved meta title for the tenant homepage. */
  homepageTitle?: string | null;
  /** Saved meta description for the tenant homepage. */
  homepageDescription?: string | null;
  /** Organization display name used in the Organization JSON-LD graph. */
  organizationName?: string | null;
  /** Organization description used in the Organization JSON-LD graph. */
  organizationDescription?: string | null;
  /** Social profile URLs surfaced as `sameAs` in the Organization JSON-LD. */
  socialProfiles?: string[] | null;
  /** Default robots policy applied to public pages that have none of their own. */
  robotsPolicy?: TenantSeoRobotsPolicy | null;
  /** Whether the default/static routes (home, catalog, stages) enter the sitemap. */
  sitemapIncludeDefault?: boolean | null;
  /** Default Twitter card image. */
  twitterImage?: string | null;
}

export interface TenantByDomainResponse {
  id: number;
  name: string;
  slug: string;
  domain: string;
  status: string;
  branding: TenantBranding;
  /** Platform-level brand colors (the "platform colors" field). Distinct from
   *  `branding`, which is the teacher appearance applied only to the teacher
   *  dashboard and login. */
  platformBranding?: TenantBranding | null;
  /** Present only when the proxy/API supplies tenant-specific SEO settings. */
  seo?: TenantSeoConfig | null;
}
