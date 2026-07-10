import type { PermissionStatus, RiskLevel, PermissionModule, PermissionAction } from "../types";

export const TENANT_PERMISSIONS_QUERY_KEY = "tenant-permissions";

export const PERMISSION_STATUS_CONFIG: Record<PermissionStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  archived: { label: "مؤرشف", color: "warning" },
};

export const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: "منخفض", color: "success" },
  medium: { label: "متوسط", color: "warning" },
  high: { label: "عالي", color: "destructive" },
  critical: { label: "حرج", color: "destructive" },
};

export const MODULE_CONFIG: Record<PermissionModule, { label: string }> = {
  dashboard: { label: "لوحة القيادة" },
  users: { label: "المستخدمون" },
  roles: { label: "الأدوار" },
  permissions: { label: "الصلاحيات" },
  courses: { label: "الدورات" },
  lessons: { label: "الدروس" },
  students: { label: "الطلاب" },
  teachers: { label: "المدربون" },
  certificates: { label: "الشهادات" },
  orders: { label: "الطلبات" },
  payments: { label: "المدفوعات" },
  analytics: { label: "التحليلات" },
  settings: { label: "الإعدادات" },
  media: { label: "الوسائط" },
  exam: { label: "الاختبارات" },
  question: { label: "الأسئلة" },
  notifications: { label: "الإشعارات" },
  reports: { label: "التقارير" },
  api: { label: "API" },
  integrations: { label: "التكاملات" },
};

export const ACTION_CONFIG: Record<PermissionAction, { label: string }> = {
  view: { label: "عرض" },
  create: { label: "إنشاء" },
  update: { label: "تعديل" },
  delete: { label: "حذف" },
  export: { label: "تصدير" },
  import: { label: "استيراد" },
  manage: { label: "إدارة" },
  approve: { label: "موافقة" },
  publish: { label: "نشر" },
  archive: { label: "أرشفة" },
  restore: { label: "استعادة" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "archived", label: "مؤرشف" },
];

export const MODULE_OPTIONS = [
  { value: "all", label: "جميع الوحدات" },
  { value: "dashboard", label: "لوحة القيادة" },
  { value: "users", label: "المستخدمون" },
  { value: "roles", label: "الأدوار" },
  { value: "permissions", label: "الصلاحيات" },
  { value: "courses", label: "الدورات" },
  { value: "lessons", label: "الدروس" },
  { value: "students", label: "الطلاب" },
  { value: "teachers", label: "المدربون" },
  { value: "certificates", label: "الشهادات" },
  { value: "orders", label: "الطلبات" },
  { value: "payments", label: "المدفوعات" },
  { value: "analytics", label: "التحليلات" },
  { value: "settings", label: "الإعدادات" },
  { value: "media", label: "الوسائط" },
  { value: "exam", label: "الاختبارات" },
  { value: "question", label: "الأسئلة" },
  { value: "notifications", label: "الإشعارات" },
  { value: "reports", label: "التقارير" },
  { value: "api", label: "API" },
  { value: "integrations", label: "التكاملات" },
];

export const ACTION_OPTIONS = [
  { value: "view", label: "عرض" },
  { value: "create", label: "إنشاء" },
  { value: "update", label: "تعديل" },
  { value: "delete", label: "حذف" },
  { value: "export", label: "تصدير" },
  { value: "import", label: "استيراد" },
  { value: "manage", label: "إدارة" },
  { value: "approve", label: "موافقة" },
  { value: "publish", label: "نشر" },
  { value: "archive", label: "أرشفة" },
  { value: "restore", label: "استعادة" },
];

export const RISK_LEVEL_OPTIONS = [
  { value: "all", label: "جميع المستويات" },
  { value: "low", label: "منخفض" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "عالي" },
  { value: "critical", label: "حرج" },
];

export const SYSTEM_OPTIONS = [
  { value: "all", label: "جميع الصلاحيات" },
  { value: "true", label: "صلاحيات النظام" },
  { value: "false", label: "صلاحيات مخصصة" },
];

export const DATE_OPTIONS = [
  { value: "all", label: "جميع التواريخ" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "older", label: "أقدم" },
];

export const SORT_OPTIONS = [
  { value: "key", label: "المفتاح" },
  { value: "nameAr", label: "الاسم بالعربية" },
  { value: "nameEn", label: "الاسم بالإنجليزية" },
  { value: "module", label: "الوحدة" },
  { value: "riskLevel", label: "مستوى المخاطرة" },
  { value: "rolesCount", label: "عدد الأدوار" },
  { value: "createdAt", label: "تاريخ الإنشاء" },
  { value: "updatedAt", label: "تاريخ التحديث" },
];

export const CREATE_MODULE_OPTIONS = MODULE_OPTIONS.filter((opt) => opt.value !== "all");
export const CREATE_ACTION_OPTIONS = ACTION_OPTIONS;
export const CREATE_RISK_LEVEL_OPTIONS = RISK_LEVEL_OPTIONS.filter((opt) => opt.value !== "all");
