"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";

const MODERATION_ROLE_SLUGS = ["moderator", "admin", "super_admin"];

/**
 * Resolves the current tenant member identity used across the community UI
 * (own-message checks, reactions, moderation affordances).
 */
export function useCurrentMember() {
  const user = useAuthStore((state) => state.user);
  const membershipId = useTenantStore((state) => state.membership?.id);
  const roles = useTenantStore((state) => state.roles);

  const memberId = useMemo(
    () => (membershipId != null ? String(membershipId) : null),
    [membershipId],
  );

  const canModerate = useMemo(
    () =>
      roles.some((role) =>
        MODERATION_ROLE_SLUGS.includes(String(role.slug).toLowerCase()),
      ),
    [roles],
  );

  return {
    memberId,
    user,
    memberName: user?.name ?? null,
    memberAvatar: user?.avatar ?? null,
    canModerate,
    isAuthenticated: memberId != null,
  };
}
