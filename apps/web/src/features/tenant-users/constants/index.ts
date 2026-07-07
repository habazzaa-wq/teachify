import type { UserStatus, UserRoleSlug, DepartmentSlug } from "../types";

export const TENANT_USERS_QUERY_KEY = "tenant-users";

export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  suspended: { label: "موقوف", color: "destructive" },
};

export const USER_ROLE_CONFIG: Record<UserRoleSlug, { label: string; color: string }> = {
  owner: { label: "مالك", color: "default" },
  admin: { label: "مدير النظام", color: "destructive" },
  manager: { label: "مدير", color: "primary" },
  instructor: { label: "مدرب", color: "success" },
  support: { label: "دعم", color: "warning" },
  reviewer: { label: "مراجع", color: "secondary" },
  marketing: { label: "تسويق", color: "info" },
  sales: { label: "مبيعات", color: "info" },
  custom: { label: "موظف مخصص", color: "outline" },
};

export const DEPARTMENT_CONFIG: Record<DepartmentSlug, { label: string }> = {
  management: { label: "الإدارة" },
  academic: { label: "أكاديمي" },
  support: { label: "الدعم الفني" },
  marketing: { label: "التسويق" },
  sales: { label: "المبيعات" },
  finance: { label: "المالية" },
  hr: { label: "الموارد البشرية" },
  it: { label: "تقنية المعلومات" },
  operations: { label: "العمليات" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "suspended", label: "موقوف" },
];

export const DEPARTMENT_OPTIONS = [
  { value: "all", label: "جميع الأقسام" },
  { value: "management", label: "الإدارة" },
  { value: "academic", label: "أكاديمي" },
  { value: "support", label: "الدعم الفني" },
  { value: "marketing", label: "التسويق" },
  { value: "sales", label: "المبيعات" },
  { value: "finance", label: "المالية" },
  { value: "hr", label: "الموارد البشرية" },
  { value: "it", label: "تقنية المعلومات" },
  { value: "operations", label: "العمليات" },
];

export const ROLE_OPTIONS = [
  { value: "all", label: "جميع الأدوار" },
  { value: "owner", label: "مالك" },
  { value: "admin", label: "مدير النظام" },
  { value: "manager", label: "مدير" },
  { value: "instructor", label: "مدرب" },
  { value: "support", label: "دعم" },
  { value: "reviewer", label: "مراجع" },
  { value: "marketing", label: "تسويق" },
  { value: "sales", label: "مبيعات" },
  { value: "custom", label: "موظف مخصص" },
];

export const TWO_FACTOR_OPTIONS = [
  { value: "all", label: "جميع حالات 2FA" },
  { value: "true", label: "مفعل" },
  { value: "false", label: "غير مفعل" },
];

export const LAST_LOGIN_OPTIONS = [
  { value: "all", label: "جميع تواريخ الدخول" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "older", label: "أقدم" },
];

export const DATE_CREATED_OPTIONS = [
  { value: "all", label: "جميع التواريخ" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "older", label: "أقدم" },
];

export const SORT_OPTIONS = [
  { value: "createdAt", label: "تاريخ الإنشاء" },
  { value: "fullName", label: "الاسم" },
  { value: "email", label: "البريد الإلكتروني" },
  { value: "lastLogin", label: "آخر دخول" },
  { value: "status", label: "الحالة" },
];

export const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ur", label: "اردو" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Riyadh", label: "الرياض (+03:00)" },
  { value: "Asia/Dubai", label: "دبي (+04:00)" },
  { value: "Asia/Kuwait", label: "الكويت (+03:00)" },
  { value: "Asia/Qatar", label: "قطر (+03:00)" },
  { value: "Asia/Bahrain", label: "البحرين (+03:00)" },
  { value: "Asia/Muscat", label: "مسقط (+04:00)" },
  { value: "Asia/Amman", label: "عمّان (+03:00)" },
  { value: "Africa/Cairo", label: "القاهرة (+02:00)" },
  { value: "Asia/Baghdad", label: "بغداد (+03:00)" },
  { value: "Asia/Beirut", label: "بيروت (+02:00)" },
  { value: "UTC", label: "UTC (+00:00)" },
  { value: "America/New_York", label: "نيويورك (-05:00)" },
  { value: "Europe/London", label: "لندن (+00:00)" },
];
