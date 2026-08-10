"use client";

import { useEffect, useMemo } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { generateCommunityThemeColors } from "@/lib/color";
import { resolveBrandHexColors, brandContrast } from "@/lib/brand";

const STYLE_ID = "brand-theme-vars";

/**
 * Applies the tenant's configured site colors (primary + secondary) globally as
 * CSS variables. All brand-colored details across the public site (navbar,
 * hero, cards, auth, wallet, courses…) read `--brand-*` so changing the colors
 * in the teacher site settings restyles the entire platform — no rebuild.
 *
 * Also overrides the `.community-theme` shadcn tokens (`--primary`/`--secondary`
 * /`--accent`/`--ring`) so framework components follow the same palette.
 */
export function BrandThemeProvider() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const branding = useTenantStore((s) => s.branding);

  const { primary, secondary } = resolveBrandHexColors(activeTenant, branding);

  const css = useMemo(() => {
    const light = generateCommunityThemeColors(primary, secondary, false);
    const dark = generateCommunityThemeColors(primary, secondary, true);
    const lightVars = Object.entries(light)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    const darkVars = Object.entries(dark)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    return `
:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-primary-contrast: ${brandContrast(primary)};
  --brand-secondary-contrast: ${brandContrast(secondary)};
}
.community-theme { ${lightVars} }
.dark .community-theme, .dark.community-theme { ${darkVars} }
`;
  }, [primary, secondary]);

  useEffect(() => {
    let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = STYLE_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
    return () => {
      styleTag?.remove();
    };
  }, [css]);

  return null;
}
