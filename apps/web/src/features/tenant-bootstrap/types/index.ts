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

export interface TenantByDomainResponse {
  id: number;
  name: string;
  slug: string;
  domain: string;
  status: string;
  branding: TenantBranding;
}
