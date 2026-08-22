export interface TenantBranding {
  logo: string | null;
  favicon: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  font: string | null;
  darkLogo: string | null;
  lightLogo: string | null;
}

export type TenantSeoRobotsPolicy = "index_follow" | "index" | "noindex" | "noindex_nofollow";

export interface TenantSeoSettings {
  titleTemplate?: string | null;
  description?: string | null;
  homepageTitle?: string | null;
  homepageDescription?: string | null;
  organizationName?: string | null;
  organizationDescription?: string | null;
  socialProfiles?: string[] | null;
  robotsPolicy?: TenantSeoRobotsPolicy | null;
  googleVerification?: string | null;
  bingVerification?: string | null;
  sitemapIncludeDefault?: boolean | null;
  ogImage?: string | null;
  twitterImage?: string | null;
}

export interface TenantByDomainResponse {
  id: number;
  name: string;
  slug: string;
  domain: string;
  status: string;
  branding: TenantBranding;
  seo?: TenantSeoSettings | null;
}
