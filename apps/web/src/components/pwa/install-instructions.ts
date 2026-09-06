/**
 * Manual "Add to Home Screen" instruction steps for the no-native-prompt path.
 *
 * Kept pure (no DOM) so the manual-instructions branch can be unit-tested the
 * same way the rest of the PWA logic is. The copy is intentionally generic:
 * iOS Safari is enumerated specifically, every other browser falls back to a
 * neutral "use your browser's install/add-to-home-screen option" phrasing.
 */

export function asInstallIosSteps(ios: boolean): string[] {
  if (ios) {
    return [
      "اضغط على زر المشاركة (Share) في شريط المتصفح أسفل الشاشة.",
      "اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen) من القائمة.",
      "اضغط «إضافة» (Add) في الزاوية العلوية لإتمام التثبيت.",
    ];
  }
  return [
    "افتح قائمة المتصفح (زر القائمة أو زر المشاركة في شريط العنوان).",
    "ابحث عن «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» واختره.",
    "أكمل خطوات المتصفح لتظهر أيقونة المنصة على جهازك.",
  ];
}