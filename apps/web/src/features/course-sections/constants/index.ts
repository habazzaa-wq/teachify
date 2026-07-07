import type { SectionStatus } from "../types";

export const SECTIONS_QUERY_KEY = "course-sections";

export const SECTION_STATUS_CONFIG: Record<SectionStatus, { label: string; color: string }> = {
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

export const PUBLISHED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "منشور" },
  { value: "false", label: "غير منشور" },
];

export const LOCKED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "مقفل" },
  { value: "false", label: "غير مقفل" },
];

export const SORT_OPTIONS = [
  { value: "sort_order", label: "الترتيب" },
  { value: "title", label: "العنوان" },
  { value: "status", label: "الحالة" },
  { value: "duration_minutes", label: "المدة" },
  { value: "created_at", label: "تاريخ الإنشاء" },
];

export const SECTION_NON_FILTER_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "all");
