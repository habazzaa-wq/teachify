"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

function saveThemeCookie(theme: ThemeMode): void {
  if (typeof document === "undefined") return;

  document.cookie = `teachify-theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`;
}

/**
 * UI state: sidebar collapse on desktop, mobile drawer open state, and the
 * preferred theme mode. Theme application (the <html> class) is handled by the
 * ThemeProvider; this store only owns the preference.
 */
interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: ThemeMode;
  hasHydrated: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      theme: "light",
      hasHydrated: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setTheme: (theme) => {
        set({ theme });
        saveThemeCookie(theme);
      },
      toggleTheme: () => {
        const theme = get().theme === "light" ? "dark" : "light";
        set({ theme });
        saveThemeCookie(theme);
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "ui-state",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UiState> | undefined;
        const storedTheme = persisted?.theme;
        const cookieTheme =
          typeof document !== "undefined"
            ? document.cookie.match(/(?:^|;\s*)teachify-theme=(dark|light)(?:;|$)/)?.[1]
            : undefined;
        const preferredTheme =
          cookieTheme === "dark" || cookieTheme === "light"
            ? cookieTheme
            : typeof window !== "undefined" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : currentState.theme;
        const theme =
          storedTheme === "dark" || storedTheme === "light"
            ? storedTheme
            : preferredTheme;

        return { ...currentState, ...persisted, theme };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
