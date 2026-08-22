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
  name?: string | null;
  favicon?: string | null;
  font?: string | null;
  logo_type?: string | null;
  logo_icon?: string | null;
  logo_image?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}
