"use client";

import { usePermissions } from "./usePermissions";

/**
 * Permission check hook. Returns true when the active membership holds the
 * given permission slug.
 *
 * UI visibility must ALWAYS use this — never hardcode role names.
 */
export function useCan(permission: string | null): boolean {
  const { hasPermission } = usePermissions();

  // A null permission means "any authenticated member".
  if (permission === null) {
    return true;
  }

  return hasPermission(permission);
}

/** Check several permissions at once. */
export function useCanAny(permissions: string[]): boolean {
  const { hasAnyPermission } = usePermissions();

  return hasAnyPermission(permissions);
}
