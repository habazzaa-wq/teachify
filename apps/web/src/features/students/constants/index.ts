export const STUDENTS_QUERY_KEY = "students";

export const STUDENT_STATUS_CONFIG: Record<"active" | "inactive" | "suspended", { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  suspended: { label: "موقوف", color: "destructive" },
};

export const ENROLLMENT_STATUS_CONFIG: Record<"pending" | "active" | "completed" | "cancelled" | "suspended", { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "warning" },
  active: { label: "نشط", color: "success" },
  completed: { label: "مكتمل", color: "default" },
  cancelled: { label: "ملغي", color: "destructive" },
  suspended: { label: "موقوف", color: "secondary" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "suspended", label: "موقوف" },
];

export const SORT_OPTIONS = [
  { value: "created_at", label: "تاريخ الإنشاء" },
  { value: "last_login_at", label: "آخر دخول" },
  { value: "last_accessed_at", label: "آخر نشاط" },
];

export const ENROLLMENT_STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "completed", label: "مكتمل" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "cancelled", label: "ملغي" },
  { value: "suspended", label: "موقوف" },
];
