export const STAGE_COURSES_QUERY_KEY = "stage-courses";
export const STAGE_QUERY_KEY = "stage";

export const STAGE_PAGE_SIZE = 12;

export const PRIMARY = "var(--brand-primary)";
export const ACCENT = "var(--brand-secondary)";

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22C55E",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
  all_levels: PRIMARY,
};

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "popular", label: "الأكثر رواجًا" },
  { value: "alphabetical", label: "أبجديًا" },
];

export const PRICING_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "free", label: "مجاني" },
  { value: "paid", label: "مدفوع" },
];
