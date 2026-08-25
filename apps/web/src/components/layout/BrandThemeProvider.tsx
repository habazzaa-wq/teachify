"use client";

import { useEffect, useMemo } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { generateCommunityThemeColors } from "@/lib/color";
import { resolveBrandHexColors, brandContrast } from "@/lib/brand";

const STYLE_ID = "brand-theme-vars";

/**
 * Applies the tenant's *platform* brand colors (primary + secondary) globally
 * as CSS variables. These are the "platform colors" field — distinct from the
 * teacher appearance settings, which only apply to the teacher dashboard and
 * login (see `useTenantTheme` / `.tenant-theme`). All brand-colored details
 * across the public site (navbar, hero, cards, auth, wallet, courses…) read
 * `--brand-*` so changing the platform colors restyles the entire platform —
 * no rebuild.
 *
 * Also overrides the `.community-theme` shadcn tokens (`--primary`/`--secondary`
 * /`--accent`/`--ring`) so framework components follow the same palette.
 */
export function BrandThemeProvider() {
  // بَس ألوان "المنصة" (platformBranding) هي اللي بتظهر على طول المنصة.
  // ألوان "مظهر لوحة التحكم" (activeTenant.branding) متطبَّقش هنا — دي مقتصرة
  // على صفحة تسجيل الدخول ولوحة تحكم المدرس بس (شوف .tenant-theme).
  const platformBranding = useTenantStore((s) => s.platformBranding);

  const { primary, secondary } = resolveBrandHexColors(null, platformBranding);

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
