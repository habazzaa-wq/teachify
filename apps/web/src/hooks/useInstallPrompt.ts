"use client";

import { useCallback, useEffect, useState } from "react";
import { useInstallPromptStore } from "@/stores/install-prompt.store";
import { useTenantStore } from "@/stores/tenant.store";
import {
  checkStandalone,
  clearInstallDismissal,
  hasInstallDismissal,
  isIosSafari,
  markInstallDismissed,
  resolveInstallPromptVariant,
  resolveInstallScope,
  type InstallPromptVariant,
} from "@/lib/pwa/install-prompt";

function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Client-side install-prompt state used by the "Install App" banner.
 *
 * Branching rules (see `resolveInstallPromptVariant`):
 *  - hidden  when already installed (standalone) or user dismissed the banner
 *  - native  when a real `beforeinstallprompt` event was captured
 *  - manual  when the browser has no native prompt (iOS Safari / unsupported)
 *
 * The hook is only mounted by the client-only `InstallAppBanner` (rendered
 * with `ssr: false`), so reading `window` during the lazy state initializers is
 * safe — the component never renders on the server.
 */
export function useInstallPrompt() {
  const deferredPrompt = useInstallPromptStore((s) => s.deferredPrompt);
  const appInstalled = useInstallPromptStore((s) => s.appInstalled);
  const dismissed = useInstallPromptStore((s) => s.dismissed);
  const setDismissed = useInstallPromptStore((s) => s.setDismissed);

  const activeTenantSlug = useTenantStore((s) => s.activeTenant?.slug);

  const [clientReady] = useState(() => isClient());
  const [standalone] = useState(() => {
    if (!isClient()) return false;
    const nav = window.navigator as unknown as { standalone?: unknown };
    let displayModeMatches = false;
    try {
      displayModeMatches = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
    } catch {
      displayModeMatches = false;
    }
    return checkStandalone({
      navigatorStandalone: nav.standalone,
      displayModeMatches,
    });
  });
  const [isIos] = useState(() =>
    isClient() ? isIosSafari(window.navigator.userAgent) : false,
  );

  const host = isClient() ? window.location.host : null;
  const scope = resolveInstallScope(activeTenantSlug, host);

  // Keep the store's `dismissed` flag in sync with persistence whenever the
  // tenant identity settles (bootstrap may resolve the slug after mount).
  const seedDismissedFromStorage = useCallback(() => {
    if (!clientReady) return;
    setDismissed(hasInstallDismissal(window.localStorage, scope));
  }, [clientReady, scope, setDismissed]);

  useEffect(() => {
    seedDismissedFromStorage();
  }, [seedDismissedFromStorage]);

  const variant = resolveInstallPromptVariant({
    standalone,
    installCompleted: appInstalled,
    deferredPrompt,
    dismissed,
  });

  /**
   * Trigger the native install flow. Resolves with the outcome:
   *  - "accepted"   → user installed the app
   *  - "dismissed"  → user declined the native dialog
   *  - "unavailable"→ no captured event to prompt with
   * Client-side only: no backend call is made in this phase.
   */
  const promptToInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    const prompt = useInstallPromptStore.getState().deferredPrompt;
    if (!prompt) return "unavailable";
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      useInstallPromptStore.getState().setDeferredPrompt(null);
      return "accepted";
    }
    return "dismissed";
  }, []);

  /** Persist the dismissal (scoped to this tenant) and hide the banner. */
  const dismiss = useCallback(() => {
    if (!isClient()) return;
    markInstallDismissed(window.localStorage, scope);
    setDismissed(true);
  }, [scope, setDismissed]);

  /** Clear a previously persisted dismissal (used by tests / debugging). */
  const resetDismissal = useCallback(() => {
    if (!isClient()) return;
    clearInstallDismissal(window.localStorage, scope);
    setDismissed(false);
  }, [scope, setDismissed]);

  return {
    variant,
    clientReady,
    deferredPrompt,
    isIos,
    scope,
    seedDismissedFromStorage,
    promptToInstall,
    dismiss,
    resetDismissal,
  };
}

export type { InstallPromptVariant };