"use client";

import { useCan } from "@/hooks/useCan";

interface PermissionGuardProps {
  /** Required permission slug. Null means any authenticated member. */
  permission: string | null;
  /** Rendered when the check passes. */
  children: React.ReactNode;
  /** Optional fallback when the check fails (defaults to nothing). */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on the active membership's permissions.
 *
 * Always use this for hiding actions, buttons, and nav items — never check
 * role names directly.
 */
function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const allowed = useCan(permission);

  return <>{allowed ? children : fallback}</>;
}

export { PermissionGuard };
