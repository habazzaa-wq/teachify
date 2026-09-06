import type { ExamSessionQuestionType } from "./types";

export const EXAM_SESSION_QUERY_KEY = "exam-session";

/** Query key for the global "active attempt" reminder check. */
export const ACTIVE_EXAM_QUERY_KEY = "exam-active-attempt";

/** How often the global reminder re-checks the server for a live attempt. */
export const ACTIVE_EXAM_POLL_MS = 60_000;

/** BroadcastChannel name used to keep the reminder in sync across tabs. */
export const ACTIVE_EXAM_CHANNEL = "techify-active-exam";

export const PROGRESS_FLUSH_MS = 5_000;

/** Timer warning thresholds in seconds (10 / 5 / 1 minute). */
export const TIMER_WARNING_SECONDS = [600, 300, 60] as const;

export const TIMER_TONES = {
  safe: "text-foreground",
  warning: "text-amber-500",
  danger: "text-orange-500",
  critical: "text-red-500 animate-pulse",
} as const;

export const QUESTION_TYPE_LABELS: Record<ExamSessionQuestionType, string> = {
  single_choice: "اختيار من متعدد",
  multiple_choice: "اختيارات متعددة",
  true_false: "صح أم خطأ",
};
