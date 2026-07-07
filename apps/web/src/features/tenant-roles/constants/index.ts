import type { RoleStatus, RoleSlug } from "../types";

export const TENANT_ROLES_QUERY_KEY = "tenant-roles";

export const ROLE_STATUS_CONFIG: Record<RoleStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  archived: { label: "مؤرشف", color: "warning" },
};

export const ROLE_SLUG_CONFIG: Record<RoleSlug, { label: string; color: string }> = {
  owner: { label: "مالك", color: "default" },
  admin: { label: "مدير النظام", color: "destructive" },
  manager: { label: "مدير", color: "primary" },
  instructor: { label: "مدرب", color: "success" },
  support: { label: "دعم", color: "warning" },
  reviewer: { label: "مراجع", color: "secondary" },
  marketing: { label: "تسويق", color: "info" },
  sales: { label: "مبيعات", color: "info" },
  "student-affairs": { label: "شؤون الطلاب", color: "info" },
  finance: { label: "المالية", color: "info" },
  custom: { label: "مخصص", color: "outline" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "archived", label: "مؤرشف" },
];

export const SYSTEM_ROLE_OPTIONS = [
  { value: "all", label: "جميع الأدوار" },
  { value: "true", label: "أدوار النظام" },
  { value: "false", label: "أدوار مخصصة" },
];

export const DEFAULT_ROLE_OPTIONS = [
  { value: "all", label: "جميع الأدوار" },
  { value: "true", label: "أدوار افتراضية" },
  { value: "false", label: "أدوار غير افتراضية" },
];

export const USERS_COUNT_OPTIONS = [
  { value: "all", label: "جميع الأعداد" },
  { value: "none", label: "بدون مستخدمين" },
  { value: "few", label: "أقل من 10" },
  { value: "many", label: "10 فأكثر" },
];

export const DATE_CREATED_OPTIONS = [
  { value: "all", label: "جميع التواريخ" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "older", label: "أقدم" },
];

export const DATE_UPDATED_OPTIONS = [
  { value: "all", label: "جميع التواريخ" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "older", label: "أقدم" },
];

export const SORT_OPTIONS = [
  { value: "createdAt", label: "تاريخ الإنشاء" },
  { value: "name", label: "الاسم" },
  { value: "nameAr", label: "الاسم بالعربية" },
  { value: "usersCount", label: "عدد المستخدمين" },
  { value: "permissionsCount", label: "عدد الصلاحيات" },
  { value: "priority", label: "الأولوية" },
  { value: "updatedAt", label: "تاريخ التحديث" },
  { value: "status", label: "الحالة" },
];

export const ROLE_ICON_OPTIONS = [
  { value: "Shield", label: "درع" },
  { value: "ShieldCheck", label: "درع موثوق" },
  { value: "ShieldHalf", label: "درع نصف" },
  { value: "Sword", label: "سيف" },
  { value: "Crown", label: "تاج" },
  { value: "Star", label: "نجمة" },
  { value: "User", label: "مستخدم" },
  { value: "Users", label: "مجموعة" },
  { value: "UserCog", label: "إعدادات المستخدم" },
  { value: "UserShield", label: "حماية المستخدم" },
  { value: "UserCheck", label: "مستخدم موثوق" },
  { value: "UserPlus", label: "إضافة مستخدم" },
  { value: "Settings", label: "إعدادات" },
  { value: "Key", label: "مفتاح" },
  { value: "Lock", label: "قفل" },
  { value: "BookOpen", label: "كتاب" },
  { value: "GraduationCap", label: "قبعة تخرج" },
  { value: "Headphones", label: "سماعات" },
  { value: "HeartHandshake", label: "مصافحة" },
  { value: "ChartBar", label: "مخطط بياني" },
];

export const ROLE_COLOR_OPTIONS = [
  { value: "#6366f1", label: "أرجواني" },
  { value: "#ef4444", label: "أحمر" },
  { value: "#22c55e", label: "أخضر" },
  { value: "#f59e0b", label: "أصفر" },
  { value: "#3b82f6", label: "أزرق" },
  { value: "#ec4899", label: "وردي" },
  { value: "#14b8a6", label: "فيروزي" },
  { value: "#f97316", label: "برتقالي" },
  { value: "#8b5cf6", label: "بنفسجي" },
  { value: "#06b6d4", label: "سماوي" },
  { value: "#84cc16", label: "ليموني" },
  { value: "#a855f7", label: "خزامى" },
];
