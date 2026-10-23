"use client";

import { resolveBrandHexColors } from "@/lib/brand";
import { usePlatformBranding } from "./usePlatformBranding";

/**
 * Reactive access to the configured *platform* brand colors (hex strings,
 * always 6-digit uppercase). Falls back to the platform defaults when the
 * tenant has not customized them. These are the "platform colors" field —
 * distinct from the teacher appearance, which only applies to the teacher
 * dashboard and login.
 */
export function useBrandColors() {
  // ألوان "المنصة" بس (platformBranding) — من غير ألوان مظهر المدرس عشان متسرّبش
  // للمنصة كلها. مظهر المدرس مقتصر على صفحة الدخول ولوحة تحكم المدرس (.tenant-theme).
  const platformBranding = usePlatformBranding();
  return resolveBrandHexColors(null, platformBranding);
}
