"use client";

import { useInstallPromptStore } from "@/stores/install-prompt.store";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";

/**
 * Early capture of the browser's install signals.
 *
 * The listeners are registered at MODULE SCOPE (not inside `useEffect`): Chrome
 * and Edge fire `beforeinstallprompt` as soon as the site's installability
 * check finishes, which on slower devices happens BEFORE React finishes
 * hydrating. A `useEffect` runs after hydration, so a listener attached there
 * misses the event and the banner falls back to "manual instructions" instead
 * of showing the native install dialog. Module scope attaches the listener the
 * moment this chunk evaluates — before React mounts — so the event is never
 * dropped.
 *
 * Renders nothing; it only owns the listeners and feeds the store.
 */
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useInstallPromptStore.getState().setDeferredPrompt(
      event as unknown as BeforeInstallPromptEvent,
    );
  });
  window.addEventListener("appinstalled", () => {
    useInstallPromptStore.getState().markAppInstalled();
    useInstallPromptStore.getState().setDeferredPrompt(null);
  });
}

export function InstallPromptBridge() {
  return null;
}