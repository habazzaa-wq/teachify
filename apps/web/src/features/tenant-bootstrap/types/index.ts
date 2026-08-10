export interface TenantBranding {
  logo: string | null;
  favicon: string | null;
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
}

export interface TenantByDomainResponse {
  id: number;
  name: string;
  slug: string;
  domain: string;
  status: string;
  branding: TenantBranding;
  /** Present only when the proxy/API supplies tenant-specific SEO settings. */
  seo?: TenantSeoConfig | null;
}
