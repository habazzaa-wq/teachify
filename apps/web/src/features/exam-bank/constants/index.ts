import {
  CircleDot,
  ListChecks,
  CheckSquare,
  Type,
  FileText,
  Underline,
  GitCompareArrows,
  ArrowDownUp,
  Hash,
  Upload,
  Code2,
  HelpCircle,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import type {
  QuestionType,
  QuestionFormat,
  ExamStatus,
  QuestionStatus,
  Difficulty,
  ExamVisibility,
  QuestionVisibility,
  CategoryStatus,
  BankStatus,
  ViewMode,
  ExamFilterParams,
  QuestionFilterParams,
} from "../types";

export const EXAM_BANK_QUERY_KEY = "exam-bank";

export const QUESTION_FORMAT_CONFIG: Record<
  QuestionFormat,
  { label: string; description: string; icon: LucideIcon; color: string; bg: string }
> = {
  text: { label: "سؤال نصي", description: "اكتب السؤال بشكل طبيعي.", icon: FileText, color: "text-studio-fg", bg: "bg-studio-soft" },
  image: { label: "سؤال ممسوح", description: "التقط أو ارفع صورة للسؤال وحوّلها إلى مسح وثائقي نظيف.", icon: ScanLine, color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

export const QUESTION_FORMAT_OPTIONS = Object.entries(QUESTION_FORMAT_CONFIG).map(([value, cfg]) => ({
  value: value as QuestionFormat,
  label: cfg.label,
  description: cfg.description,
  icon: cfg.icon,
}));

export const QUESTION_TYPE_CONFIG: Record<
  QuestionType,
  { label: string; icon: LucideIcon; color: string; bg: string; group: "choice" | "text" | "interactive" | "extended" }
> = {
  single_choice: { label: "اختيار منفرد", icon: CircleDot, color: "text-sky-500", bg: "bg-sky-500/10", group: "choice" },
  multiple_choice: { label: "اختيار متعدد", icon: ListChecks, color: "text-indigo-500", bg: "bg-indigo-500/10", group: "choice" },
  true_false: { label: "صح وخطأ", icon: CheckSquare, color: "text-teal-500", bg: "bg-teal-500/10", group: "choice" },
  short_answer: { label: "إجابة قصيرة", icon: Type, color: "text-amber-500", bg: "bg-amber-500/10", group: "text" },
  essay: { label: "مقالة", icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10", group: "text" },
  fill_blank: { label: "املأ الفراغ", icon: Underline, color: "text-violet-500", bg: "bg-violet-500/10", group: "text" },
  matching: { label: "مطابقة", icon: GitCompareArrows, color: "text-cyan-500", bg: "bg-cyan-500/10", group: "interactive" },
  ordering: { label: "ترتيب", icon: ArrowDownUp, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", group: "interactive" },
  numeric: { label: "رقمي", icon: Hash, color: "text-lime-500", bg: "bg-lime-500/10", group: "interactive" },
  file_upload: { label: "رفع ملف", icon: Upload, color: "text-slate-500", bg: "bg-slate-500/10", group: "extended" },
  coding: { label: "برمجة", icon: Code2, color: "text-orange-500", bg: "bg-orange-500/10", group: "extended" },
};

export const QUESTION_TYPE_OPTIONS = [
  { value: "all" as const, label: "جميع الأنواع" },
  ...Object.entries(QUESTION_TYPE_CONFIG).map(([value, cfg]) => ({
    value: value as QuestionType,
    label: cfg.label,
  })),
];

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "سهل", color: "success" },
  medium: { label: "متوسط", color: "warning" },
  hard: { label: "صعب", color: "destructive" },
};

export const DIFFICULTY_OPTIONS = [
  { value: "all", label: "جميع المستويات" },
  { value: "easy", label: "سهل" },
  { value: "medium", label: "متوسط" },
  { value: "hard", label: "صعب" },
];

export const EXAM_STATUS_CONFIG: Record<ExamStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  published: { label: "منشور", color: "success" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const QUESTION_STATUS_CONFIG: Record<QuestionStatus, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "secondary" },
  published: { label: "منشور", color: "success" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const CATEGORY_STATUS_CONFIG: Record<CategoryStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const BANK_STATUS_CONFIG: Record<BankStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "secondary" },
  archived: { label: "مؤرشف", color: "destructive" },
};

export const VISIBILITY_CONFIG: Record<ExamVisibility, { label: string; icon: string }> = {
  private: { label: "خاص", icon: "Lock" },
  organization: { label: "المؤسسة", icon: "Building2" },
  public: { label: "عام", icon: "Globe" },
};

export const VISIBILITY_OPTIONS = [
  { value: "all", label: "جميع المستويات" },
  { value: "private", label: "خاص" },
  { value: "organization", label: "المؤسسة" },
  { value: "public", label: "عام" },
];

export const EXAM_STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "published", label: "منشور" },
  { value: "archived", label: "مؤرشف" },
];

export const QUESTION_STATUS_OPTIONS = EXAM_STATUS_OPTIONS;

export const SORT_OPTIONS = [
  { value: "created_at", label: "تاريخ الإنشاء" },
  { value: "updated_at", label: "آخر تعديل" },
  { value: "title", label: "العنوان" },
  { value: "question_count", label: "عدد الأسئلة" },
  { value: "total_points", label: "إجمالي النقاط" },
  { value: "passing_score", label: "درجة النجاح" },
];

export const QUESTION_SORT_OPTIONS = [
  { value: "created_at", label: "تاريخ الإنشاء" },
  { value: "updated_at", label: "آخر تعديل" },
  { value: "title", label: "العنوان" },
  { value: "type", label: "النوع" },
  { value: "difficulty", label: "الصعوبة" },
  { value: "points", label: "النقاط" },
];

export const EXAM_TYPE_GROUPS: Array<{ label: string; types: QuestionType[] }> = [
  { label: "الاختيارات", types: ["single_choice", "multiple_choice", "true_false"] },
  { label: "النصية", types: ["short_answer", "essay", "fill_blank"] },
  { label: "التفاعلية", types: ["matching", "ordering", "numeric"] },
  { label: "امتداد", types: ["file_upload", "coding"] },
];

export const DEFAULT_EXAM_FILTERS: ExamFilterParams = {
  status: "all",
  visibility: "all",
  category: "all",
  sort: "updated_at",
  sortDir: "desc",
  perPage: 24,
};

export const DEFAULT_QUESTION_FILTERS: QuestionFilterParams = {
  type: "all",
  difficulty: "all",
  status: "all",
  visibility: "all",
  categoryId: "all",
  bankId: "all",
  sort: "created_at",
  sortDir: "desc",
  perPage: 24,
};

export const POINT_PRESETS = [1, 2, 3, 5, 10];

export const FEATURED_LIMIT = 8;
export const PINNED_LIMIT = 6;
export const RECENT_LIMIT = 6;
