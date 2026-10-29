"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { InstructorMembership, InstructorUser } from "./types";

interface InstructorAuthState {
  user: InstructorUser | null;
  membership: InstructorMembership | null;
  accessToken: string | null;
  refreshToken: string | null;
  mustChangePassword: boolean;
  hasHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setSession: (
    user: InstructorUser,
    membership: InstructorMembership,
    accessToken: string,
    refreshToken: string | null,
    mustChangePassword: boolean,
  ) => void;
  setCredentials: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

export const useInstructorAuthStore = create<InstructorAuthState>()(
  persist(
    (set) => ({
      user: null,
      membership: null,
      accessToken: null,
      refreshToken: null,
      mustChangePassword: false,
      hasHydrated: false,
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      setSession: (user, membership, accessToken, refreshToken, mustChangePassword) =>
        set({ user, membership, accessToken, refreshToken, mustChangePassword }),
      setCredentials: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, mustChangePassword: false }),
      clear: () =>
        set({
          user: null,
          membership: null,
          accessToken: null,
          refreshToken: null,
          mustChangePassword: false,
        }),
    }),
    {
      name: "instructor-auth-state",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
      partialize: (state) => ({
        user: state.user,
        membership: state.membership,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        mustChangePassword: state.mustChangePassword,
      }),
    },
  ),
);
