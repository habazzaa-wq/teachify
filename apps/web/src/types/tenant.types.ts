import type {
  AuthAbility,
  AuthMembership,
  AuthNavigationItem,
  AuthPermission,
  AuthRole,
  AuthTenant,
  AuthUser,
  FeatureFlags,
  Plan,
  Subscription,
} from "./auth.types";

export interface TenantContext {
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

export type ActiveTenant = AuthTenant;
export type Membership = AuthMembership;
export type Role = AuthRole;
export type Permission = AuthPermission;
export type { AuthAbility as Ability, AuthNavigationItem as NavigationItem };
