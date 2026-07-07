"use client";

import { usePermissionContext } from "@/providers/PermissionProvider";

/**
 * Expose the resolved permissions and roles. Prefer useCan for single checks.
 */
export function usePermissions() {
  const { permissions, roles, hasPermission, hasAnyPermission, hasRole } =
    usePermissionContext();

  return { permissions, roles, hasPermission, hasAnyPermission, hasRole };
}
