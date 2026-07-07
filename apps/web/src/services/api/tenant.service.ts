import api from "./axios";
import type { CurrentUserResponse } from "@/types/auth.types";
import type { TenantContext } from "@/types/tenant.types";

export const tenantService = {
  async resolveContext(): Promise<TenantContext> {
    const { data } = await api.get<CurrentUserResponse>("/tenant/auth/me");

    return {
      user: data.user,
      tenant: data.tenant,
      membership: data.membership,
      roles: data.roles,
      permissions: data.permissions,
      abilities: data.abilities,
      navigation: data.navigation,
      subscription: data.subscription,
      plan: data.plan,
      feature_flags: data.feature_flags,
    };
  },

  async resolveFromLogin(loginData: CurrentUserResponse): Promise<TenantContext> {
    return {
      user: loginData.user,
      tenant: loginData.tenant,
      membership: loginData.membership,
      roles: loginData.roles,
      permissions: loginData.permissions,
      abilities: loginData.abilities,
      navigation: loginData.navigation,
      subscription: loginData.subscription,
      plan: loginData.plan,
      feature_flags: loginData.feature_flags,
    };
  },
};
