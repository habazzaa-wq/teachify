import type { Role } from "@/types/tenant.types";

/**
 * Roles that are allowed into the tenant control panel (teacher dashboard).
 * Student memberships are never granted dashboard access.
 */
export const STAFF_ROLE_SLUGS: readonly string[] = [
  "tenant_owner",
  "admin",
  "instructor",
];

/** True when the given role grants control-panel access. */
export function isStaffRole(role: Role | undefined | null): boolean {
  return Boolean(role?.slug) && STAFF_ROLE_SLUGS.includes(role!.slug);
}

/** True when any of the membership's roles grants control-panel access. */
export function hasStaffAccess(roles: Role[] | undefined | null): boolean {
  return Array.isArray(roles) && roles.some(isStaffRole);
}

/**
 * True when the membership holds at least one role and none of them grant
 * control-panel access (a student-only account).
 */
export function isStudentOnly(roles: Role[] | undefined | null): boolean {
  return Array.isArray(roles) && roles.length > 0 && !hasStaffAccess(roles);
}
