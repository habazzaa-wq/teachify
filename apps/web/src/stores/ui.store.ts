"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

/**
 * UI state: sidebar collapse on desktop, mobile drawer open state, and the
 * preferred theme mode. Theme application (the <html> class) is handled by the
 * ThemeProvider; this store only owns the preference.
 */
interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      theme: "light",
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setTheme: (theme) => {
        console.log("[ui.store] setTheme called with:", theme);
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => {
          console.log("[ui.store] toggleTheme, current theme:", state.theme);
          return { theme: state.theme === "light" ? "dark" : "light" };
        });
      },
    }),
    {
      name: "ui-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
