"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PlatformAdminProfile,
  PlatformUser,
} from "@/types/platform-auth.types";

export type PlatformAuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface PlatformAuthState {
  token: string | null;
  user: PlatformUser | null;
  platformAdmin: PlatformAdminProfile | null;
  status: PlatformAuthStatus;
  setSession: (payload: {
    token: string;
    user: PlatformUser;
    platformAdmin: PlatformAdminProfile;
  }) => void;
  setStatus: (status: PlatformAuthStatus) => void;
  clear: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      platformAdmin: null,
      status: "idle",
      setSession: ({ token, user, platformAdmin }) =>
        set({
          token,
          user,
          platformAdmin,
          status: "authenticated",
        }),
      setStatus: (status) => set({ status }),
      clear: () =>
        set({
          token: null,
          user: null,
          platformAdmin: null,
          status: "unauthenticated",
        }),
    }),
    {
      name: "platform-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    },
  ),
);

export function getPlatformToken(): string | null {
  return usePlatformAuthStore.getState().token;
}
