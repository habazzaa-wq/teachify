import type { LessonStatus, LessonVisibility, LessonType } from "../types";

export const LESSONS_QUERY_KEY = "lessons";

export const LESSON_STATUS_CONFIG: Record<LessonStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  review: { label: "مراجعة", color: "warning" },
  published: { label: "منشور", color: "success" },
  scheduled: { label: "مجدول", color: "info" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const LESSON_VISIBILITY_CONFIG: Record<LessonVisibility, { label: string; color: string }> = {
  private: { label: "خاص", color: "secondary" },
  preview: { label: "معاينة", color: "warning" },
  public: { label: "عام", color: "success" },
};

export const LESSON_TYPE_CONFIG: Record<LessonType, { label: string; color: string }> = {
  video: { label: "فيديو", color: "primary" },
  text: { label: "نص", color: "info" },
  pdf: { label: "PDF", color: "destructive" },
  external: { label: "خارجي", color: "warning" },
  live: { label: "مباشر", color: "success" },
};

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "review", label: "مراجعة" },
  { value: "published", label: "منشور" },
  { value: "scheduled", label: "مجدول" },
  { value: "archived", label: "مؤرشف" },
];

export const VISIBILITY_OPTIONS = [
  { value: "all", label: "جميع الرؤية" },
  { value: "private", label: "خاص" },
  { value: "preview", label: "معاينة" },
  { value: "public", label: "عام" },
];

export const LESSON_TYPE_OPTIONS = [
  { value: "all", label: "جميع الأنواع" },
  { value: "video", label: "فيديو" },
  { value: "text", label: "نص" },
  { value: "pdf", label: "PDF" },
  { value: "external", label: "خارجي" },
  { value: "live", label: "مباشر" },
];

export const FEATURED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "true", label: "مميز" },
  { value: "false", label: "عادي" },
];

export const SORT_OPTIONS = [
  { value: "sort_order", label: "الترتيب" },
  { value: "title", label: "العنوان" },
  { value: "status", label: "الحالة" },
  { value: "visibility", label: "الرؤية" },
  { value: "lesson_type", label: "النوع" },
  { value: "estimated_duration", label: "المدة" },
  { value: "created_at", label: "تاريخ الإنشاء" },
];

export const LESSON_NON_FILTER_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "all");
export const LESSON_NON_FILTER_VISIBILITY_OPTIONS = VISIBILITY_OPTIONS.filter((v) => v.value !== "all");
export const LESSON_NON_FILTER_TYPE_OPTIONS = LESSON_TYPE_OPTIONS.filter((t) => t.value !== "all");

export const DEFAULT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export const DEFAULT_ICONS = [
  "Video", "BookOpen", "FileText", "File", "Globe",
  "Radio", "Headphones", "Monitor", "Smartphone", "PenTool",
];
