"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  resolveBrandThemeColors,
} from "@/lib/brand-theme";

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
 * ملاحظة حول منع الوميض (FOUC): الألوان الحقيقية بتتطبّع server-side في <head>
 * عن طريق BrandThemeSSR (نفس id الـ <style>) — فلأول رسمة من اول رسمة بالألوان
 * الصحيحة. هنا على الـ client بنعيد كتابة نفس العنصر جوه المكان بس لما الألوان
 * الحية (platformBranding) تبقى معروفة فعلاً، وبنمنع كتابة قيم الـ fallback
 * (الموجودة في globals.css) مكانها قبل ما توصل الألوان — وده كان سبب الوميض.
 */
export function BrandThemeProvider() {
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);
  const loadRef = useRef(false);

  // تحميل ذاتي لألوان المنصة (مرّة واحدة، ومستقل عن حالة تسجيل الدخول). لو كانت
  // الألوان موجودة من الـ SSR/البوتستراب بنكتفي بيها.
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

  const { primary, secondary } = resolveBrandThemeColors(platformBranding);

  const css = useMemo(() => buildBrandThemeCss(primary, secondary), [primary, secondary]);

  useEffect(() => {
    // لو مفيش حتى الآن branding حقيقي (middleware/SSR ماجابهاش والـ fetch لسه
    // شغال)، منكتبش style إطلاقاً عشان منستبدلش الألوان الصحيحة اللي طبّعها الـ
    // SSR في <head> بألوان الـ fallback — اللي كان سبب الوميض. أول ما توصل
    // الألوان الحقيقية، بنعيد كتابة نفس العنصر جوه المكان بالقيم نفسها فمفيش تغيير مرئي.
    if (!platformBranding) return;

    let styleTag = document.getElementById(BRAND_THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = BRAND_THEME_STYLE_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
    return () => {
      styleTag?.remove();
    };
  }, [css, platformBranding]);

  return null;
}