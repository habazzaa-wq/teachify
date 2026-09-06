"use client";

import { useState } from "react";
import { ArrowDownToLine, X, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveBrandHexColors, brandContrast } from "@/lib/brand";
import { mixWithBlack, mixWithWhite } from "@/lib/color";
import { cn } from "@/lib/cn";
import { InstallInstructionsDialog } from "@/components/pwa/InstallInstructionsDialog";

/**
 * Per-tenant "Install App" pill.
 *
 * Placement: injected once in `PublicLayout` (the tenant storefront layout),
 * immediately under the sticky header, so it is visible once per public page
 * instead of being scattered ad hoc across components.
 *
 * Behavior:
 *  - hides automatically when already running as an installed PWA
 *    (standalone display mode) or after `appinstalled`;
 *  - triggers the real `beforeinstallprompt` dialog when the browser captured
 *    the event (Chrome / Edge / Android);
 *  - shows manual "add to home screen" instructions when no native event
 *    exists (notably iOS Safari);
 *  - persists dismissal per tenant (localStorage, tenant-scoped).
 */
export function InstallAppBanner() {
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const { variant, clientReady, isIos, promptToInstall, dismiss } =
    useInstallPrompt();
  const [manualOpen, setManualOpen] = useState(false);

  const isHidden = !clientReady || variant === "hidden";

  // Reuses the shared brand-color resolution (the same tenant/platform source
  // the manifest theme-color flows from) — never a hardcoded color.
  const { primary } = resolveBrandHexColors(tenant, platformBranding);
  const iconOn = brandContrast(primary);
  const labelColor = isDark ? mixWithWhite(primary, 0.4) : mixWithBlack(primary, 0.28);

  async function handleInstallClick() {
    if (variant === "native") {
      const result = await promptToInstall();
      // Client-side only in this phase: log the native user-choice outcome.
      console.info("[install-prompt] native prompt outcome:", result);
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

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        <div
          className="mx-auto my-2 flex max-w-7xl items-center gap-2 rounded-full border px-2.5 py-1.5 transition-colors"
          style={{
            backgroundColor: `${primary}10`,
            borderColor: `${primary}30`,
          }}
        >
          <button
            type="button"
            onClick={handleInstallClick}
            className={cn(
              "group flex min-w-0 flex-1 items-center gap-2 rounded-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            )}
            style={{
              // flex-row-reverse forces the icon to the physical left even
              // though the page is RTL, matching the spec's icon-on-the-left.
              flexDirection: "row-reverse",
            }}
            aria-label={
              variant === "native"
                ? "تثبيت المنصة على جهازك"
                : "شرح طريقة إضافة المنصة إلى الشاشة الرئيسية"
            }
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: primary }}
            >
              {variant === "native" ? (
                <ArrowDownToLine className="h-3.5 w-3.5" style={{ color: iconOn }} />
              ) : (
                <Smartphone className="h-3.5 w-3.5" style={{ color: iconOn }} />
              )}
            </span>
            <span
              className="min-w-0 truncate text-[13px] font-medium leading-relaxed"
              style={{ color: labelColor }}
            >
              {variant === "native"
                ? "ثبّت المنصة على جهازك للوصول السريع"
                : "أضف المنصة إلى الشاشة الرئيسية لاستخدامها بسهولة"}
            </span>
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="إخفاء"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: labelColor }}
          >
            <X className="h-3.5 w-3.5" />
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