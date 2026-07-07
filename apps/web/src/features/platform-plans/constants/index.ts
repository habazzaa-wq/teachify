import type { PlanStatus, PlanBadge, BillingType, VideoFormat, VideoQuality } from "../types";

export const PLAN_STATUS_CONFIG: Record<PlanStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  active: { label: "نشط", color: "success" },
  hidden: { label: "مخفي", color: "warning" },
  archived: { label: "مؤرشف", color: "outline" },
};

export const PLAN_BADGE_CONFIG: Record<PlanBadge, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" }> = {
  most_popular: { label: "الأكثر شهرة", variant: "default" },
  best_value: { label: "أفضل قيمة", variant: "success" },
  enterprise: { label: "مؤسسات", variant: "destructive" },
  custom: { label: "مخصص", variant: "secondary" },
  new: { label: "جديد", variant: "warning" },
  limited: { label: "محدود", variant: "outline" },
};

export const BILLING_TYPE_OPTIONS: { value: BillingType | "all"; label: string }[] = [
  { value: "all", label: "جميع الفواتير" },
  { value: "monthly", label: "شهري" },
  { value: "yearly", label: "سنوي" },
  { value: "both", label: "شهري وسنوي" },
];

export const STATUS_OPTIONS: { value: PlanStatus | "all"; label: string }[] = [
  { value: "all", label: "جميع الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "active", label: "نشط" },
  { value: "hidden", label: "مخفي" },
  { value: "archived", label: "مؤرشف" },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "displayOrder", label: "ترتيب العرض" },
  { value: "name", label: "الاسم" },
  { value: "monthlyPrice", label: "السعر الشهري" },
  { value: "yearlyPrice", label: "السعر السنوي" },
  { value: "createdAt", label: "تاريخ الإنشاء" },
];

export const FEATURE_GROUPS = [
  {
    title: "التعليم",
    icon: "graduation-cap",
    features: [
      { key: "courses", label: "الدورات" },
      { key: "certificates", label: "الشهادات" },
      { key: "assignments", label: "الواجبات" },
      { key: "quizzes", label: "الاختبارات" },
      { key: "discussions", label: "النقاشات" },
      { key: "notes", label: "الملاحظات" },
      { key: "bookmarks", label: "المراجع" },
    ],
  },
  {
    title: "التحليلات",
    icon: "bar-chart",
    features: [
      { key: "basicAnalytics", label: "تحليلات أساسية" },
      { key: "advancedAnalytics", label: "تحليلات متقدمة" },
    ],
  },
  {
    title: "الفيديو",
    icon: "video",
    features: [
      { key: "bunnyStream", label: "بث مباشر" },
      { key: "videoStreaming", label: "بث الفيديو" },
      { key: "videoDownloadProtection", label: "حماية تحميل الفيديو" },
      { key: "videoAnalytics", label: "تحليلات الفيديو" },
    ],
  },
  {
    title: "العلامة التجارية",
    icon: "palette",
    features: [
      { key: "customBranding", label: "علامة تجارية مخصصة" },
      { key: "whiteLabel", label: "علامة بيضاء" },
      { key: "customDomain", label: "نطاق مخصص" },
    ],
  },
  {
    title: "الأمان",
    icon: "shield",
    features: [
      { key: "auditLogs", label: "سجلات التدقيق" },
      { key: "activityLogs", label: "سجلات النشاط" },
      { key: "apiAccess", label: "الوصول إلى API" },
      { key: "webhooks", label: "Webhooks" },
    ],
  },
  {
    title: "التكاملات",
    icon: "puzzle",
    features: [
      { key: "smtp", label: "SMTP" },
      { key: "stripe", label: "Stripe" },
      { key: "paypal", label: "PayPal" },
      { key: "zoom", label: "Zoom" },
      { key: "googleMeet", label: "Google Meet" },
      { key: "microsoftTeams", label: "Microsoft Teams" },
    ],
  },
  {
    title: "الذكاء الاصطناعي",
    icon: "sparkles",
    features: [
      { key: "aiAssistant", label: "مساعد ذكي" },
      { key: "aiGrading", label: "تصحيح ذكي" },
      { key: "aiAnalytics", label: "تحليلات ذكية" },
    ],
  },
] as const;

export const ALLOWED_VIDEO_FORMATS: { value: VideoFormat; label: string }[] = [
  { value: "mp4", label: "MP4" },
  { value: "mov", label: "MOV" },
  { value: "avi", label: "AVI" },
  { value: "mkv", label: "MKV" },
  { value: "webm", label: "WEBM" },
];

export const ALLOWED_VIDEO_QUALITIES: { value: VideoQuality; label: string }[] = [
  { value: "720", label: "720p" },
  { value: "1080", label: "1080p" },
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K" },
];

export const PLAN_COLORS = [
  { value: "#6366f1", label: "بنفسجي" },
  { value: "#3b82f6", label: "أزرق" },
  { value: "#10b981", label: "أخضر" },
  { value: "#f59e0b", label: "ذهبي" },
  { value: "#ef4444", label: "أحمر" },
  { value: "#8b5cf6", label: "نبيذي" },
  { value: "#06b6d4", label: "سيان" },
  { value: "#f97316", label: "برتقالي" },
];

export const PLAN_GRADIENTS = [
  { value: "from-indigo-500 to-purple-600", label: "نيلي إلى نبيذي" },
  { value: "from-blue-500 to-cyan-500", label: "أزرق إلى سيان" },
  { value: "from-emerald-500 to-teal-500", label: "زمردي إلى أزرق مخضر" },
  { value: "from-amber-500 to-orange-600", label: "عنبر إلى برتقالي" },
  { value: "from-rose-500 to-red-600", label: "وردي إلى أحمر" },
  { value: "from-violet-500 to-purple-600", label: "بنفسجي إلى نبيذي" },
  { value: "from-cyan-500 to-blue-600", label: "سيان إلى أزرق" },
  { value: "from-orange-500 to-red-600", label: "برتقالي إلى أحمر" },
];

export const PLAN_ICONS = [
  { value: "rocket", label: "صاروخ" },
  { value: "star", label: "نجمة" },
  { value: "crown", label: "تاج" },
  { value: "zap", label: "صاعقة" },
  { value: "gem", label: "جوهرة" },
  { value: "shield", label: "درع" },
  { value: "sparkles", label: "تألق" },
  { value: "award", label: "جائزة" },
];

export const CURRENCY_OPTIONS = [
  { value: "SAR", label: "ريال سعودي (SAR)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "USD", label: "دولار أمريكي (USD)" },
  { value: "EUR", label: "يورو (EUR)" },
];

export const PLANS_QUERY_KEY = "platform-plans";
