import type { TenantStatus, TenantLanguage, BillingCycle, TenantCurrency, BillingStatus } from "../types";

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  trial: { label: "تجريبي", color: "info" },
  suspended: { label: "موقوف", color: "destructive" },
  archived: { label: "مؤرشف", color: "outline" },
  pending: { label: "قيد الانتظار", color: "warning" },
  cancelled: { label: "ملغي", color: "secondary" },
  expired: { label: "منتهي", color: "destructive" },
};

export const STATUS_OPTIONS: { value: TenantStatus | "all"; label: string }[] = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "trial", label: "تجريبي" },
  { value: "suspended", label: "موقوف" },
  { value: "archived", label: "مؤرشف" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "cancelled", label: "ملغي" },
  { value: "expired", label: "منتهي" },
];

export const SUBSCRIPTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "جميع الباقات" },
  { value: "starter", label: "ستارتر" },
  { value: "basic", label: "أساسي" },
  { value: "professional", label: "احترافية" },
  { value: "business", label: "أعمال" },
  { value: "enterprise", label: "مؤسسات" },
  { value: "unlimited", label: "غير محدود" },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "name", label: "الترتيب الأبجدي" },
  { value: "revenue", label: "أعلى إيرادات" },
  { value: "storage", label: "أعلى تخزين" },
  { value: "users", label: "أعلى مستخدمين" },
  { value: "videos", label: "أعلى فيديوهات" },
];

export const COUNTRY_OPTIONS = [
  { value: "all", label: "جميع الدول" },
  { value: "SA", label: "المملكة العربية السعودية" },
  { value: "AE", label: "الإمارات العربية المتحدة" },
  { value: "QA", label: "قطر" },
  { value: "KW", label: "الكويت" },
  { value: "OM", label: "عمان" },
  { value: "BH", label: "البحرين" },
  { value: "EG", label: "مصر" },
  { value: "JO", label: "الأردن" },
  { value: "LB", label: "لبنان" },
  { value: "US", label: "الولايات المتحدة" },
  { value: "UK", label: "المملكة المتحدة" },
  { value: "FR", label: "فرنسا" },
];

export const LANGUAGE_OPTIONS: { value: TenantLanguage | "all"; label: string }[] = [
  { value: "all", label: "جميع اللغات" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "الإنجليزية" },
  { value: "fr", label: "الفرنسية" },
  { value: "ur", label: "الأردية" },
  { value: "es", label: "الإسبانية" },
];

export const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "شهري" },
  { value: "yearly", label: "سنوي" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "semi-annual", label: "نصف سنوي" },
];

export const CURRENCY_OPTIONS: { value: TenantCurrency; label: string }[] = [
  { value: "SAR", label: "ريال سعودي (SAR)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "USD", label: "دولار أمريكي (USD)" },
  { value: "EUR", label: "يورو (EUR)" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Riyadh", label: "الرياض (UTC+3)" },
  { value: "Asia/Dubai", label: "دبي (UTC+4)" },
  { value: "Asia/Qatar", label: "قطر (UTC+3)" },
  { value: "Asia/Kuwait", label: "الكويت (UTC+3)" },
  { value: "Africa/Cairo", label: "القاهرة (UTC+2)" },
  { value: "America/New_York", label: "نيويورك (UTC-5)" },
  { value: "Europe/London", label: "لندن (UTC+0)" },
  { value: "Europe/Paris", label: "باريس (UTC+1)" },
];

export const LANGUAGE_MAP: Record<TenantLanguage, string> = {
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  ur: "الأردية",
  es: "الإسبانية",
};

export const BILLING_STATUS_OPTIONS: { value: BillingStatus | "all"; label: string }[] = [
  { value: "all", label: "جميع حالات الفوترة" },
  { value: "paid", label: "مدفوع" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "overdue", label: "متأخر" },
  { value: "cancelled", label: "ملغي" },
  { value: "free", label: "مجاني" },
];

export const SEARCH_OPTIONS: { value: string; label: string }[] = [
  { value: "name", label: "اسم المؤسسة" },
  { value: "owner", label: "المالك" },
  { value: "email", label: "البريد الإلكتروني" },
  { value: "domain", label: "النطاق" },
  { value: "plan", label: "الباقة" },
];

export const TAG_OPTIONS = [
  "مؤسسة تعليمية",
  "مركز تدريب",
  "جامعة",
  "مدرسة",
  "أكاديمية",
  "شركة",
  "منظمة غير ربحية",
  "قطاع حكومي",
  "قطاع خاص",
  "فترة تجريبية",
  "عقد سنوي",
  "مدفوع بالكامل",
  "VIP",
];

export const PLANS = [
  { id: "plan_01", name: "ستارتر", price: 99, currency: "SAR", storage: 10, bandwidth: 50, videos: 50, courses: 5, users: 50, trialDays: 14 },
  { id: "plan_02", name: "أساسي", price: 199, currency: "SAR", storage: 50, bandwidth: 200, videos: 200, courses: 20, users: 200, trialDays: 14 },
  { id: "plan_03", name: "احترافية", price: 399, currency: "SAR", storage: 200, bandwidth: 500, videos: 500, courses: 50, users: 500, trialDays: 14 },
  { id: "plan_04", name: "أعمال", price: 799, currency: "SAR", storage: 500, bandwidth: 1000, videos: 2000, courses: 150, users: 2000, trialDays: 7 },
  { id: "plan_05", name: "مؤسسات", price: 1999, currency: "SAR", storage: 1000, bandwidth: 2000, videos: 10000, courses: 500, users: 10000, trialDays: 0 },
];

export const TENANTS_QUERY_KEY = "platform-tenants";

export const DRAWER_TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "owner", label: "المالك" },
  { value: "users", label: "المستخدمين" },
  { value: "subscription", label: "الباقة" },
  { value: "domains", label: "النطاقات" },
  { value: "branding", label: "العلامة التجارية" },
  { value: "storage", label: "التخزين" },
  { value: "activity", label: "النشاط" },
  { value: "security", label: "الأمان" },
  { value: "logs", label: "السجلات" },
];

export const WIZARD_SECTIONS = [
  { id: 1, label: "معلومات عامة" },
  { id: 2, label: "النطاق" },
  { id: 3, label: "الباقة" },
  { id: 4, label: "حساب المالك" },
  { id: 5, label: "العلامة التجارية" },
  { id: 6, label: "ملاحظات داخلية" },
];
