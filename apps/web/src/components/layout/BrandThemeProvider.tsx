"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import {
  generateCommunityThemeColors,
  generateBrandScale,
  generateThemeColors,
} from "@/lib/color";
import { resolveBrandHexColors, brandContrast } from "@/lib/brand";

const STYLE_ID = "brand-theme-vars";

/**
 * المصدر الوحيد والموثوق لألوان المنصة (platformBranding) على طول التطبيق.
 *
 * بيطبّق نفس لونين الأساسيين (primary/secondary) على كل الأسطح الملوّنة:
 *   · .community-theme  → الموقع العام (navbar/hero/cards/wallet/courses…)
 *   · .tenant-theme     → لوحة تحكم المدرس + صفحة تسجيل الدخول
 *   · .student-theme    → لوحة الطالب
 *   · :root --brand-*   → متغيّرات الألوان الخام الجاهزة للاستخدام المباشر
 *
 * وده بيضمن إن الزائر والمسجّل دخول (مدرس/طالب) يشوفوا نفس ألوان المنصة بالظبط،
 * ومن غير أي اعتماد على مظهر المدرس (activeTenant.branding) أو على localStorage.
 *
 * كمان بيحمّل ألوان المنصة مرّة واحدة مستقلة عن بوتستراب الـ tenant أو تسجيل
 * الدخول، ويرجع يحمّلها لو اتلغت — فمفيش أي فرصة تظهر ألوان studio الافتراضية
 * (teal/green) وقت الانتقال بين الصفحات أو بعد تسجيل الدخول.
 */
export function BrandThemeProvider() {
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);
  const loadRef = useRef(false);

  // تحميل ذاتي لألوان المنصة (مرّة واحدة، ومستقل عن حالة تسجيل الدخول).
  useEffect(() => {
    if (platformBranding || loadRef.current) return;
    loadRef.current = true;
    const host = window.location.host;
    fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(host)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.platform_branding) setPlatformBranding(data.platform_branding);
      })
      .catch(() => {
        // لو فشل، نسمح بإعادة المحاولة في المرة الجاية.
        loadRef.current = false;
      });
  }, [platformBranding, setPlatformBranding]);

  const { primary, secondary } = resolveBrandHexColors(null, platformBranding);

  const css = useMemo(() => {
    const light = {
      ...generateCommunityThemeColors(primary, secondary, false),
      ...generateBrandScale(primary, secondary, false),
    };
    const dark = {
      ...generateCommunityThemeColors(primary, secondary, true),
      ...generateBrandScale(primary, secondary, true),
    };
    // لوحة كاملة (خلفيات/قوائم/أزرار) مشتقّة من لوني المنصة.
    const dashLight = generateThemeColors(primary, secondary, false);
    const dashDark = generateThemeColors(primary, secondary, true);

    const toVars = (obj: Record<string, string>) =>
      Object.entries(obj)
        .map(([k, v]) => `${k}: ${v};`)
        .join("");

    return `
:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-primary-contrast: ${brandContrast(primary)};
  --brand-secondary-contrast: ${brandContrast(secondary)};
}
.community-theme { ${toVars(light)} }
.dark .community-theme, .dark.community-theme { ${toVars(dark)} }
.tenant-theme { ${toVars(dashLight)} }
.dark .tenant-theme, .dark.tenant-theme { ${toVars(dashDark)} }
.student-theme { ${toVars(dashLight)} }
.dark .student-theme, .dark.student-theme { ${toVars(dashDark)} }
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
