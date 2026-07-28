"use client";

import { createContext, useContext, useMemo } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import type { Permission, Role } from "@/types/tenant.types";

interface PermissionProviderValue {
  permissions: Permission[];
  roles: Role[];
  hasPermission: (slug: string) => boolean;
  hasAnyPermission: (slugs: string[]) => boolean;
  hasRole: (slug: string) => boolean;
}

const PermissionContext = createContext<PermissionProviderValue | null>(null);

/**
 * UI authorization helper.
 *
 * The backend is permission-driven, so all visibility checks go through
 * `hasPermission(slug)`. Role checks are provided only for coarse layout needs
 * (e.g. showing a role badge) and must NOT replace permission checks for
 * hiding actions, pages, or sidebar items.
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const permissions = useTenantStore((state) => state.permissions);
  const roles = useTenantStore((state) => state.roles);

  const value = useMemo<PermissionProviderValue>(() => {
    const permissionSet = new Set(permissions.map((p) => p.slug));
    const roleSet = new Set(roles.map((r) => r.slug));

    return {
      permissions,
      roles,
      hasPermission: (slug: string) => permissionSet.has(slug),
      hasAnyPermission: (slugs: string[]) =>
        slugs.some((slug) => permissionSet.has(slug)),
      hasRole: (slug: string) => roleSet.has(slug),
    };
  }, [permissions, roles]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext(): PermissionProviderValue {
  const ctx = useContext(PermissionContext);

  if (!ctx) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider",
    );
  }

  return ctx;
}
