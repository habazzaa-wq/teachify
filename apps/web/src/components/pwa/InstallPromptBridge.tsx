"use client";

import { useInstallPromptStore } from "@/stores/install-prompt.store";
import { useTenantStore } from "@/stores/tenant.store";
import {
  clearInstallCompletion,
  markInstallCompleted,
  resolveInstallScope,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install-prompt";

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
  const hostScope = resolveInstallScope(null, window.location.host);

  // The "installed" flag set by `appinstalled` survives an uninstall in some
  // browsers (desktop Chromium keeps origin localStorage in the browser
  // profile), so it must be cleared explicitly. The reliable "not installed
  // anymore" signal is `beforeinstallprompt` re-firing: Chrome/Edge only fire
  // it while the origin is installable, i.e. AFTER the user removes the app.
  const clearStaleInstallCompletion = () => {
    try {
      const tenantSlug = useTenantStore.getState().activeTenant?.slug;
      clearInstallCompletion(
        window.localStorage,
        resolveInstallScope(tenantSlug, window.location.host),
      );
      clearInstallCompletion(window.localStorage, hostScope);
    } catch {
      // best-effort (private/blocked contexts)
    }
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useInstallPromptStore.getState().setDeferredPrompt(
      event as unknown as BeforeInstallPromptEvent,
    );
    clearStaleInstallCompletion();
  });
  window.addEventListener("appinstalled", () => {
    useInstallPromptStore.getState().markAppInstalled();
    useInstallPromptStore.getState().setDeferredPrompt(null);
    // Persist "installed" so the icon stays hidden on future visits even
    // though Chrome/Edge no longer fire `beforeinstallprompt`.
    markInstallCompleted(window.localStorage, hostScope);
  });
}

export function InstallPromptBridge() {
  return null;
}