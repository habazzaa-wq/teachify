"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addApiRequestContextReader } from "@/services/api/request-context";
import type { AuthUser } from "@/types/auth.types";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  isAuthenticated: () => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      accessToken: null,
      refreshToken: null,

      setUser: (user) =>
        set({
          user,
          status: user ? "authenticated" : "unauthenticated",
        }),

      setStatus: (status) => set({ status }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      isAuthenticated: () => get().status === "authenticated",

      clear: () =>
        set({
          user: null,
          status: "unauthenticated",
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: "auth-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

// Provide the access token to the API layer lazily at request time instead of
// importing this store from the axios module (see services/api/request-context.ts).
addApiRequestContextReader(() => ({
  accessToken: useAuthStore.getState().accessToken,
}));
