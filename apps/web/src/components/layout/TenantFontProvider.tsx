"use client";

import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import {
  getFontCssUrl,
  buildFontStack,
  resolveTenantFont,
} from "@/features/settings/constants/google-fonts";

const LINK_ID = "tenant-dynamic-font";

const DEFAULT_FONT_STACK = 'var(--font-cairo-local), "Cairo", "system-ui", "sans-serif"';
const DEFAULT_DISPLAY_STACK = 'var(--font-almarai-local), "Almarai", "system-ui", "sans-serif"';

/**
 * Applies the one tenant-selected font to every surface at runtime: dashboard,
 * public site, login, instructor and student shells all inherit `--font-sans`
 * and `--font-display` from <html>.
 *
 * The root layout already injects the stylesheet + both variables server-side,
 * so this only reacts to changes made in the current session (e.g. after the
 * teacher saves a new font) without a full page reload.
 */
export function TenantFontProvider() {
  const { tenant } = useActiveTenant();
  const storeFont = useTenantStore((s) => s.branding?.font ?? null);
  const platformFont = useTenantStore((s) => s.platformBranding?.font ?? null);

  // `tenant` falls back to the server-resolved payload, so on the first client
  // render this equals the font the server already applied. Without that, the
  // effect below used to strip the SSR font for a moment (font flash).
  // platformBranding is never persisted, so it is the freshest source after
  // SSR/bootstrap; the persisted tenant copy is only a compatibility fallback.
  const font = resolveTenantFont(
    { font: platformFont },
    tenant?.platform_branding,
    tenant?.branding,
    { font: storeFont },
  );

  useEffect(() => {
    const root = document.documentElement;
    const cssUrl = getFontCssUrl(font);
    const fontStack = buildFontStack(font);
    const active = Boolean(font && fontStack);

    // Some public headings use `font-display`; it must follow the same face
    // instead of the shell's editorial display font once a font is chosen.
    if (active) root.setAttribute("data-tenant-font", "true");
    else root.removeAttribute("data-tenant-font");

    root.style.setProperty("--font-sans", fontStack ?? DEFAULT_FONT_STACK);
    root.style.setProperty("--font-display", fontStack ?? DEFAULT_DISPLAY_STACK);

    if (!cssUrl) {
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
  }, [font]);

  return null;
}
