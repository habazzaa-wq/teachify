"use client";

import { useTenantStore } from "@/stores/tenant.store";

export function useFeatureFlag(flag: string): boolean {
  const navigation = useTenantStore((state) => state.navigation);
  const abilities = useTenantStore((state) => state.abilities);

  if (!flag) return true;

  if (navigation.length === 0 && !abilities) return true;

  if (abilities) {
    const abilityMap: Record<string, boolean> = {
      courses: abilities.can_manage_courses,
      users: abilities.can_manage_users,
      settings: abilities.can_manage_settings,
      dashboard: abilities.can_access_dashboard,
    };
    if (flag in abilityMap) return abilityMap[flag] ?? true;
  }

  return true;
}

export function useFeatureFlags(): Record<string, boolean> {
  const abilities = useTenantStore((state) => state.abilities);

  if (!abilities) return {};

  return {
    dashboard: abilities.can_access_dashboard,
    courses: abilities.can_manage_courses,
    users: abilities.can_manage_users,
    settings: abilities.can_manage_settings,
  };
}
