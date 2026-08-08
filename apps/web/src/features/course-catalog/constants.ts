export const CATALOG_QUERY_KEY = "course-catalog";
export const CATALOG_STAGES_KEY = "catalog-stages";

export const CATALOG_PAGE_SIZE = 12;

/** Larger page size used only by the sitemap crawler (fewer API round-trips). */
export const CATALOG_SITEMAP_PAGE_SIZE = 100;

export const PRIMARY = "#BF6D58";
export const ACCENT = "#FFB50E";

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
  { value: "price_asc", label: "السعر: من الأقل" },
  { value: "price_desc", label: "السعر: من الأعلى" },
];

export const PRICING_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "free", label: "مجاني" },
  { value: "paid", label: "مدفوع" },
];
