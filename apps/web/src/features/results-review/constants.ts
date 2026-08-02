import type { ReviewFilter, ReviewStatus } from "./types";

export const EXAM_RESULT_QUERY_KEY = "exam-result";
export const EXAM_HISTORY_QUERY_KEY = "exam-history";

export const REVIEW_FILTERS: Array<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "correct", label: "صحيحة" },
  { value: "wrong", label: "خاطئة" },
  { value: "skipped", label: "لم تُجب" },
];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  correct: "إجابة صحيحة",
  wrong: "إجابة خاطئة",
  skipped: "لم تتم الإجابة",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};
