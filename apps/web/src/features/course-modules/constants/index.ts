import type { ModuleStatus } from "../types";

export const MODULES_QUERY_KEY = "course-modules";

export const MODULE_STATUS_CONFIG: Record<ModuleStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  published: { label: "منشور", color: "success" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "published", label: "منشور" },
  { value: "archived", label: "مؤرشف" },
];

export const FEATURED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "مميز" },
  { value: "false", label: "غير مميز" },
];

export const SORT_OPTIONS = [
  { value: "order", label: "الترتيب" },
  { value: "title", label: "العنوان" },
  { value: "status", label: "الحالة" },
  { value: "estimated_duration", label: "المدة" },
  { value: "created_at", label: "تاريخ الإنشاء" },
];
