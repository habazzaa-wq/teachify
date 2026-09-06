"use client";

import { create } from "zustand";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";

/**
 * Global holder for the captured `beforeinstallprompt` event and install
 * state. `InstallPromptBridge` (mounted as high in the tree as possible) is
 * the only writer; the banner + hook read from it. Storing the event here
 * instead of inside a component guarantees the event is never dropped between
 * the moment the browser fires it and the moment the banner mounts.
 */
interface InstallPromptState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** True once the `appinstalled` event fires (install completed this session). */
  appInstalled: boolean;
  /** Bumped on every `appinstalled` so subscribers re-evaluate. */
  installedVersion: number;
  /** Whether the current tenant's banner was dismissed (this page load). */
  dismissed: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  markAppInstalled: () => void;
  setDismissed: (dismissed: boolean) => void;
}

export const useInstallPromptStore = create<InstallPromptState>((set) => ({
  deferredPrompt: null,
  appInstalled: false,
  installedVersion: 0,
  dismissed: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  markAppInstalled: () =>
    set((state) => ({
      appInstalled: true,
      installedVersion: state.installedVersion + 1,
    })),
  setDismissed: (dismissed) => set({ dismissed }),
}));