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
}
