"use client";

import { useEffect } from "react";
import { generateThemeColors } from "@/lib/color";

/**
 * Injects the tenant's two brand colors (primary + secondary) as CSS variables
 * scoped to `selector`. This is the single source of truth for the control
 * panel and the tenant login page, so the chosen colors are identical across
 * every device (the values come from the server-synced tenant, not from
 * per-device localStorage).
 */
export function useTenantTheme({
  primaryColor,
  secondaryColor,
  isDark,
  styleId = "tenant-theme-vars",
  selector = ".tenant-theme",
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isDark: boolean;
  styleId?: string;
  selector?: string;
}) {
  useEffect(() => {
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!primaryColor || !secondaryColor) {
      if (styleTag) styleTag.remove();
      return;
    }

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const colors = generateThemeColors(primaryColor, secondaryColor, isDark);
    const vars = Object.entries(colors)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    styleTag.textContent = `${selector} { ${vars} }`;
  }, [primaryColor, secondaryColor, isDark, styleId, selector]);
}
