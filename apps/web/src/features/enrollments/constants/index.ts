import type { EnrollmentStatus } from "../types";

export const ENROLLMENTS_QUERY_KEY = "enrollments";

export const ENROLLMENT_STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "warning" },
  active: { label: "نشط", color: "success" },
  completed: { label: "مكتمل", color: "default" },
  cancelled: { label: "ملغي", color: "destructive" },
  suspended: { label: "موقوف", color: "secondary" },
};
