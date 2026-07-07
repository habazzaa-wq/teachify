import type { CategoryStatus } from "../types";

export const CATEGORIES_QUERY_KEY = "categories";

export const CATEGORY_STATUS_CONFIG: Record<CategoryStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشت" },
];

export const FEATURED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "مميز" },
  { value: "false", label: "عادي" },
];

export const PARENT_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "none", label: "تصنيفات رئيسية" },
  { value: "has", label: "تصنيفات فرعية" },
];

export const HAS_COURSES_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "بدورات" },
  { value: "false", label: "بدون دورات" },
];

export const SORT_OPTIONS = [
  { value: "sort_order", label: "الترتيب" },
  { value: "name", label: "الاسم" },
  { value: "slug", label: "المعرّف" },
  { value: "featured", label: "مميز" },
  { value: "active", label: "الحالة" },
  { value: "created_at", label: "تاريخ الإنشاء" },
  { value: "updated_at", label: "تاريخ التحديث" },
];

export const CATEGORY_NON_FILTER_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "all");
export const CATEGORY_NON_FILTER_FEATURED_OPTIONS = FEATURED_OPTIONS.filter((f) => f.value !== "all");
export const CATEGORY_NON_FILTER_PARENT_OPTIONS = PARENT_OPTIONS.filter((p) => p.value !== "all");
export const CATEGORY_NON_FILTER_HAS_COURSES_OPTIONS = HAS_COURSES_OPTIONS.filter((h) => h.value !== "all");

export const DEFAULT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
];

export const DEFAULT_ICONS = [
  "BookOpen",
  "GraduationCap",
  "Code",
  "Palette",
  "Music",
  "Dumbbell",
  "Camera",
  "Globe",
  "Zap",
  "Heart",
  "Star",
  "Target",
  "Award",
  "Rocket",
  "Brain",
];