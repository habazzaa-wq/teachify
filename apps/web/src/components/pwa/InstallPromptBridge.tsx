"use client";

import { useEffect } from "react";
import { useInstallPromptStore } from "@/stores/install-prompt.store";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";

/**
 * Early capture of the browser's install signals.
 *
 * Mounted at the top of the shared provider tree so the `beforeinstallprompt`
 * event is intercepted (and `preventDefault()` called) before any page content
 * renders. Chrome fires this event before React typically hydrates, so if we
 * waited for the banner to mount we would miss it entirely.
 *
 * Renders nothing — it only owns the listeners and feeds the store.
 */
export function InstallPromptBridge() {
  const setDeferredPrompt = useInstallPromptStore((s) => s.setDeferredPrompt);
  const markAppInstalled = useInstallPromptStore((s) => s.markAppInstalled);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as unknown as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      markAppInstalled();
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [setDeferredPrompt, markAppInstalled]);

  return null;
}