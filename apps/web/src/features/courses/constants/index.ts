import type { CourseStatus, CourseVisibility, CourseDifficulty, PricingType } from "../types";

export const COURSES_QUERY_KEY = "courses";

export const COURSE_STATUS_CONFIG: Record<CourseStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  review: { label: "مراجعة", color: "warning" },
  published: { label: "منشور", color: "success" },
  scheduled: { label: "مجدول", color: "default" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const COURSE_VISIBILITY_CONFIG: Record<CourseVisibility, { label: string; color: string }> = {
  private: { label: "خاص", color: "secondary" },
  public: { label: "عام", color: "success" },
  unlisted: { label: "مخفي", color: "warning" },
};

export const COURSE_DIFFICULTY_CONFIG: Record<CourseDifficulty, { label: string }> = {
  beginner: { label: "مبتدئ" },
  intermediate: { label: "متوسط" },
  advanced: { label: "متقدم" },
  all_levels: { label: "جميع المستويات" },
};

export const PRICING_TYPE_CONFIG: Record<PricingType, { label: string }> = {
  free: { label: "مجاني" },
  one_time: { label: "دفعة واحدة" },
  subscription: { label: "اشتراك" },
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
  { value: "all", label: "جميع أنواع الظهور" },
  { value: "private", label: "خاص" },
  { value: "public", label: "عام" },
  { value: "unlisted", label: "مخفي" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "all", label: "جميع المستويات" },
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all_levels", label: "جميع المستويات" },
];

export const PRICING_TYPE_OPTIONS = [
  { value: "all", label: "جميع أنواع السعر" },
  { value: "free", label: "مجاني" },
  { value: "one_time", label: "دفعة واحدة" },
  { value: "subscription", label: "اشتراك" },
];

export const LANGUAGE_OPTIONS = [
  { value: "all", label: "جميع اللغات" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ur", label: "اردو" },
];

export const SORT_OPTIONS = [
  { value: "created_at", label: "تاريخ الإنشاء" },
  { value: "title", label: "العنوان" },
  { value: "status", label: "الحالة" },
  { value: "published_at", label: "تاريخ النشر" },
  { value: "price_amount", label: "السعر" },
  { value: "duration", label: "المدة" },
];

export const COURSE_NON_FILTER_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "all");
export const COURSE_NON_FILTER_VISIBILITY_OPTIONS = VISIBILITY_OPTIONS.filter((v) => v.value !== "all");
export const COURSE_NON_FILTER_DIFFICULTY_OPTIONS = DIFFICULTY_OPTIONS.filter((d) => d.value !== "all");
export const COURSE_NON_FILTER_PRICING_OPTIONS = PRICING_TYPE_OPTIONS.filter((p) => p.value !== "all");
