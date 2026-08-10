export interface TenantSettings {
  profile?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  locale?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  enrollment?: Record<string, unknown>;
  video?: Record<string, unknown>;
  storage?: Record<string, unknown>;
  setup?: Record<string, unknown>;
}

export interface SiteSettings {
  name: string;
  favicon: string | null;
  logo?: string | null;
  dark_logo?: string | null;
  light_logo?: string | null;
  /** "icon" | "image" | null — how the navbar logo should be rendered. */
  logo_type?: string | null;
  /** Icon key from the built-in icon library when logo_type === "icon". */
  logo_icon?: string | null;
  /** Media-library image URL when logo_type === "image". */
  logo_image?: string | null;
  /** Google Fonts family name used across the whole platform. */
  font?: string | null;
  /** Primary brand color (hex) — drives the whole public site theme. */
  primary_color?: string | null;
  /** Secondary brand color (hex) — drives the whole public site theme. */
  secondary_color?: string | null;
}

export type NavbarLogoType = "icon" | "image";
