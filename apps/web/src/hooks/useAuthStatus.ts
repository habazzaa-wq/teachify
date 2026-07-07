"use client";

import { useAuth } from "@/providers/AuthProvider";

/**
 * Convenience accessors for the current user and auth status.
 */
export function useCurrentUser() {
  const { user, status } = useAuth();

  return { user, status, isAuthenticated: status === "authenticated" };
}

export function useAuthStatus() {
  const { status } = useAuth();

  return status;
}
