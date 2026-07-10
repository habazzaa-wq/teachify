"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DashboardThemeState {
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  setColors: (primary: string, secondary: string) => void;
  resetColors: () => void;
}

export const useDashboardThemeStore = create<DashboardThemeState>()(
  persist(
    (set) => ({
      primaryColor: "#4F46E5",
      secondaryColor: "#F1F5F9",
      isActive: false,
      setColors: (primary, secondary) =>
        set({ primaryColor: primary, secondaryColor: secondary, isActive: true }),
      resetColors: () =>
        set({ isActive: false }),
    }),
    {
      name: "dashboard-theme",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
