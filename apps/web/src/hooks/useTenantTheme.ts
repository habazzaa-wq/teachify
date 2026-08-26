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
  fallbackPrimary,
  fallbackSecondary,
  styleId = "tenant-theme-vars",
  selector = ".tenant-theme",
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isDark: boolean;
  /** Platform brand colors used when the teacher appearance is not customized,
   *  so the dashboard/login still reflects the academy's real brand instead of
   *  the unrelated default studio palette. */
  fallbackPrimary?: string | null;
  fallbackSecondary?: string | null;
  styleId?: string;
  selector?: string;
}) {
  useEffect(() => {
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    // Prefer the teacher appearance colors; fall back to the platform brand so
    // the control panel never shows the wrong default studio palette.
    const primary = primaryColor || fallbackPrimary || null;
    const secondary = secondaryColor || fallbackSecondary || null;

    // We need at least a primary color to build a coherent theme. If only one
    // of the pair is missing (e.g. the saved appearance has no secondary color),
    // fall back to the studio default for the other so the chosen primary is
    // always reflected instead of dropping the whole theme and reverting to the
    // unrelated default studio palette.
    if (!primary) {
      if (styleTag) styleTag.remove();
      return;
    }
    const safeSecondary = secondary || "#F1F5F9";

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const colors = generateThemeColors(primary, safeSecondary, isDark);
    const vars = Object.entries(colors)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    styleTag.textContent = `${selector} { ${vars} }`;
  }, [primaryColor, secondaryColor, fallbackPrimary, fallbackSecondary, isDark, styleId, selector]);
}
