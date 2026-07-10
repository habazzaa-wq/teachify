"use client";

import { create } from "zustand";
import type { BunnySection } from "../types";

interface BunnySettingsUIState {
  activeSection: BunnySection;
  setActiveSection: (section: BunnySection) => void;
}

export const useBunnySettingsUIStore = create<BunnySettingsUIState>(
  (set) => ({
    activeSection: "connection",
    setActiveSection: (section) => set({ activeSection: section }),
  }),
);
