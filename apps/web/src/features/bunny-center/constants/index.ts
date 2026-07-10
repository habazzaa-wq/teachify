export const BUNNY_CENTER_QUERY_KEY = "bunny-center";

export const PLAN_OPTIONS = [
  { value: "all", label: "جميع الباقات" },
  { value: "ستارتر", label: "ستارتر" },
  { value: "أساسي", label: "أساسي" },
  { value: "احترافية", label: "احترافية" },
  { value: "أعمال", label: "أعمال" },
  { value: "مؤسسات", label: "مؤسسات" },
];

export const HEALTH_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "healthy", label: "سليم" },
  { value: "warning", label: "تحذير" },
  { value: "critical", label: "حرج" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "suspended", label: "موقوف" },
  { value: "trial", label: "تجريبي" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "expired", label: "منتهي" },
];

export const SEARCH_BY_OPTIONS = [
  { value: "tenant", label: "المؤسسة" },
  { value: "email", label: "البريد الإلكتروني" },
  { value: "subdomain", label: "النطاق الفرعي" },
  { value: "plan", label: "الباقة" },
  { value: "storage", label: "التخزين" },
  { value: "bandwidth", label: "النطاق الترددي" },
  { value: "views", label: "المشاهدات" },
];

export const PERCENTAGE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "0-25", label: "0% - 25%" },
  { value: "25-50", label: "25% - 50%" },
  { value: "50-75", label: "50% - 75%" },
  { value: "75-90", label: "75% - 90%" },
  { value: "90-100", label: "90% - 100%" },
];

export const ALERT_TYPES_CONFIG = {
  storage: { label: "التخزين", color: "hsl(var(--warning))" },
  bandwidth: { label: "النطاق الترددي", color: "hsl(var(--warning))" },
  views: { label: "المشاهدات", color: "hsl(var(--warning))" },
  subscription: { label: "الاشتراك", color: "hsl(var(--destructive))" },
  sync: { label: "المزامنة", color: "hsl(var(--destructive))" },
  webhook: { label: "Webhook", color: "hsl(var(--destructive))" },
  retry: { label: "إعادة المحاولة", color: "hsl(var(--warning))" },
} as const;

export const SEVERITY_CONFIG = {
  critical: { label: "حرج", color: "destructive" as const },
  warning: { label: "تحذير", color: "warning" as const },
  info: { label: "معلومات", color: "secondary" as const },
};
