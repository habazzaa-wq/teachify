"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveBrandHexColors, brandContrast } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { InstallInstructionsDialog } from "@/components/pwa/InstallInstructionsDialog";

const HINT_SHOW_MS = 4500;
const HINT_HIDE_MS = 2600;
const HINT_FIRST_DELAY_MS = 900;

/**
 * Per-tenant "Install App" pill.
 *
 * Placement: injected once in `PublicLayout`. Rendered as a small floating
 * icon pinned to the far right edge of the page, next to a self-hiding hint
 * ("ثبّت المنصة على جهازك") that fades in and out on a loop so it stays
 * discoverable without permanently occupying page space.
 *
 * Behavior:
 *  - hides automatically when already running as an installed PWA
 *    (standalone display mode) or after `appinstalled`;
 *  - triggers the real `beforeinstallprompt` dialog when the browser captured
 *    the event (Chrome / Edge / Android);
 *  - shows manual "add to home screen" instructions when no native event
 *    exists (notably iOS Safari);
 *  - the hint loop pauses while hovered / focused, and the button hides for
 *    the rest of the page load once dismissed (session-only — it returns on
 *    the next visit).
 */
export function InstallAppBanner() {
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);

  const { variant, clientReady, isIos, promptToInstall, dismiss } =
    useInstallPrompt();
  const [manualOpen, setManualOpen] = useState(false);

  const [hintVisible, setHintVisible] = useState(false);
  const [hintPaused, setHintPaused] = useState(false);

  useEffect(() => {
    if (hintPaused) return;

    let timer: number | undefined;
    let cancelled = false;

    const cycle = () => {
      setHintVisible(true);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setHintVisible(false);
        timer = window.setTimeout(() => {
          if (cancelled) return;
          cycle();
        }, HINT_HIDE_MS);
      }, HINT_SHOW_MS);
    };

    timer = window.setTimeout(cycle, HINT_FIRST_DELAY_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [hintPaused]);

  const isHidden = !clientReady || variant === "hidden";

  const { primary } = resolveBrandHexColors(tenant, platformBranding);
  const iconOn = brandContrast(primary);

  async function handleInstallClick() {
    if (variant === "native") {
      const result = await promptToInstall();
      if (result === "accepted") {
        dismiss();
      }
      return;
    }
    setManualOpen(true);
  }

  if (isHidden) {
    return null;
  }

  const hintLabel = "تثبيت المنصة على جهازك";

  return (
    <>
      <div dir="rtl" className="fixed right-3 top-1/2 z-[70] -translate-y-1/2">
        <div
          className="relative flex items-center"
          onMouseEnter={() => setHintPaused(true)}
          onMouseLeave={() => setHintPaused(false)}
        >
          <div
            className={cn(
              "absolute right-full mr-3 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold shadow-xl transition-all duration-300",
              hintVisible
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-1.5 opacity-0",
            )}
            style={{
              backgroundColor: primary,
              color: iconOn,
              boxShadow: `0 8px 24px ${primary}40`,
            }}
          >
            <span
              aria-hidden
              className="absolute right-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45"
              style={{ backgroundColor: primary }}
            />
            <span>{hintLabel}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                dismiss();
              }}
              aria-label="إخفاء تلميح التثبيت"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            aria-label={hintLabel}
            title={hintLabel}
            className="group flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: primary,
              boxShadow: `0 8px 22px ${primary}50`,
            }}
          >
            <Smartphone
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
              style={{ color: iconOn }}
            />
          </button>
        </div>
      </div>

      <InstallInstructionsDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        isIos={isIos}
        accentColor={primary}
      />
    </>
  );
}