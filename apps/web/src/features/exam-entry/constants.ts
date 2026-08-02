import type { ExamEligibility, ExamLockedReason } from "./types";

export const EXAM_ENTRY_QUERY_KEY = "exam-entry";

export const EXAM_STATUS_META: Record<
  ExamEligibility,
  { label: string; className: string }
> = {
  available: {
    label: "متاح",
    className:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  },
  completed: {
    label: "مكتمل",
    className:
      "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  },
  locked: {
    label: "مقفل",
    className:
      "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  },
  unavailable: {
    label: "غير متاح",
    className:
      "bg-muted text-muted-foreground ring-border/40 dark:text-muted-foreground/70",
  },
};

export const EXAM_LOCKED_REASON_LABELS: Record<
  Exclude<ExamLockedReason, null>,
  string
> = {
  lesson_locked: "الدرس غير متاح حاليًا.",
  max_attempts_reached: "استنفدت جميع المحاولات المتاحة لهذا الامتحان.",
  exam_not_published: "الامتحان غير منشور بعد.",
  no_questions: "لم تُضف أسئلة إلى هذا الامتحان بعد.",
  no_exam: "لا يوجد امتحان مرتبط بهذا الدرس.",
};

export const EXAM_WARNINGS = [
  "يبدأ عدّاد الوقت فور البدء ولا يمكن إيقافه أو إعادة تعيينه.",
  "لا يمكنك تحديث الصفحة أو مغادرتها أثناء حل الامتحان.",
  "تُسجَّل إجاباتك تلقائيًا عند انتهاء الوقت المحدد.",
  "استخدم اتصال إنترنت مستقرًا طوال مدة الامتحان.",
];
