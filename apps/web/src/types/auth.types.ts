import type { ApiMessageResponse } from "./common.types";
import type { TenantBranding } from "@/features/tenant-bootstrap/types";

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  is_platform_super_admin: boolean;
}

export interface AuthTenant {
  id: number;
  name: string;
  slug: string;
  status: string;
  domain: string;
  branding?: AuthBranding;
  /** Platform-level brand colors (the "platform colors" field). Distinct from
   *  `branding`, which is the teacher appearance and only applies to the teacher
   *  dashboard and login. The API returns this as `platform_branding`. */
  platformBranding?: TenantBranding | null;
  platform_branding?: TenantBranding | null;
}

export interface AuthBranding {
  logo: string | null;
  favicon: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font: string | null;
  dark_logo: string | null;
  light_logo: string | null;
  /** "icon" | "image" | null — how the navbar logo should be rendered. */
  logo_type?: string | null;
  /** Icon key from the built-in icon library when logo_type === "icon". */
  logo_icon?: string | null;
  /** Media-library image URL when logo_type === "image". */
  logo_image?: string | null;
  domain?: string;
}

export interface AuthBrandingSimple {
  logo: string | null;
  favicon: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  font: string | null;
  darkLogo: string | null;
  lightLogo: string | null;
}

export interface AuthRole {
  id: number;
  name: string;
  slug: string;
}

export interface AuthPermission {
  id: number;
  name: string;
  slug: string;
}

export interface AuthAbility {
  can_access_dashboard: boolean;
  can_manage_courses: boolean;
  can_manage_users: boolean;
  can_manage_settings: boolean;
}

export interface AuthNavigationItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  required_permission: string | null;
}

export interface AuthMembership {
  id: number;
  status: string;
  tenant_id?: number;
  joined_at?: string | null;
  last_accessed_at: string | null;
}

export interface Subscription {
  plan: string;
  status: string;
  started_at: string | null;
  ends_at: string | null;
}

export interface Plan {
  name: string;
  slug: string;
  features: Record<string, unknown>;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
  tenant: AuthTenant;
  membership: AuthMembership;
  roles: AuthRole[];
  permissions: AuthPermission[];
  abilities: AuthAbility;
  navigation: AuthNavigationItem[];
  subscription: Subscription | null;
  plan: Plan | null;
  feature_flags: FeatureFlags | null;
}

export interface RefreshResponse {
  message: string;
  access_token: string;
  token_type: string;
}

export interface CurrentUserResponse {
  user: AuthUser;
  tenant: AuthTenant;
  membership: AuthMembership;
  roles: AuthRole[];
  permissions: AuthPermission[];
  abilities: AuthAbility;
  navigation: AuthNavigationItem[];
  subscription: Subscription | null;
  plan: Plan | null;
  feature_flags: FeatureFlags | null;
}

export type LogoutResponse = ApiMessageResponse;
