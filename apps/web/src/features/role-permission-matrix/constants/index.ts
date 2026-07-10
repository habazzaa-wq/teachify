import type { PermissionModule, RiskLevel } from "../types";

export const ROLE_PERMISSION_MATRIX_QUERY_KEY = "role-permission-matrix";

export const MODULE_CONFIG: Record<PermissionModule, { label: string; icon: string; order: number }> = {
  dashboard: { label: "لوحة القيادة", icon: "LayoutDashboard", order: 1 },
  users: { label: "المستخدمون", icon: "Users", order: 2 },
  roles: { label: "الأدوار", icon: "Shield", order: 3 },
  permissions: { label: "الصلاحيات", icon: "Key", order: 4 },
  courses: { label: "الدورات", icon: "BookOpen", order: 5 },
  lessons: { label: "الدروس", icon: "FileText", order: 6 },
  students: { label: "الطلاب", icon: "GraduationCap", order: 7 },
  teachers: { label: "المدربون", icon: "ChalkboardTeacher", order: 8 },
  certificates: { label: "الشهادات", icon: "Award", order: 9 },
  orders: { label: "الطلبات", icon: "ShoppingCart", order: 10 },
  payments: { label: "المدفوعات", icon: "CreditCard", order: 11 },
  analytics: { label: "التحليلات", icon: "BarChart3", order: 12 },
  reports: { label: "التقارير", icon: "FileBarChart", order: 13 },
  settings: { label: "الإعدادات", icon: "Settings", order: 14 },
  media: { label: "الوسائط", icon: "Image", order: 15 },
  exam: { label: "الاختبارات", icon: "ClipboardList", order: 16 },
  question: { label: "الأسئلة", icon: "ListChecks", order: 17 },
  notifications: { label: "الإشعارات", icon: "Bell", order: 18 },
  api: { label: "API", icon: "Code2", order: 17 },
  integrations: { label: "التكاملات", icon: "Puzzle", order: 18 },
};

export const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: "منخفض", color: "success" },
  medium: { label: "متوسط", color: "warning" },
  high: { label: "عالي", color: "destructive" },
  critical: { label: "حرج", color: "destructive" },
};

export const MODULE_OPTIONS = Object.entries(MODULE_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([value, config]) => ({ value, label: config.label }));

export const RISK_LEVEL_OPTIONS = [
  { value: "all", label: "جميع المستويات" },
  { value: "low", label: "منخفض" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "عالي" },
  { value: "critical", label: "حرج" },
];

export const DEFAULT_EXPANDED_MODULES: Record<string, boolean> = {
  dashboard: true,
  users: true,
  roles: true,
  permissions: true,
};
