"use client";

import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { getFontCssUrl, buildFontStack } from "@/features/settings/constants/google-fonts";

const LINK_ID = "tenant-dynamic-font";

/**
 * Applies the tenant-selected Google Font to the whole document at runtime.
 * The root layout already injects the stylesheet + `--font-sans` server-side,
 * so this only reacts to changes made in the current session (e.g. after the
 * teacher saves a new font) without a full page reload.
 */
export function TenantFontProvider() {
  const font = useTenantStore(
    (s) => s.activeTenant?.branding?.font ?? s.branding?.font ?? null,
  );

  useEffect(() => {
    const root = document.documentElement;
    const cssUrl = getFontCssUrl(font);
    const fontStack = buildFontStack(font);

    if (!cssUrl || !fontStack) {
      root.style.removeProperty("--font-sans");
      document.getElementById(LINK_ID)?.remove();
      return;
    }

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== cssUrl) {
      link.setAttribute("href", cssUrl);
    }
    root.style.setProperty("--font-sans", fontStack);
  }, [font]);

  return null;
}
