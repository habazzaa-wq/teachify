import type { GradeResult, GradingAnswer, GradingQueueItem, Raw } from "./types";

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Map one raw grading-queue item (camelCase keys from Laravel resources). */
export function mapQueueItem(raw: Raw): GradingQueueItem {
  const student = typeof raw.student === "object" && raw.student !== null ? raw.student : null;

  return {
    id: String(raw.id),
    examAttemptId: String(raw.examAttemptId),
    examQuestionId: String(raw.examQuestionId),
    questionId: String(raw.questionId),
    gradingStatus: raw.gradingStatus as GradingQueueItem["gradingStatus"],
    answerMode: raw.answerMode as GradingQueueItem["answerMode"],
    points: Number(raw.points ?? 0),
    pageCount: toNullableNumber(raw.pageCount),
    student: student
      ? { id: String(student.id), name: toNullableString(student.name) }
      : null,
    answeredAt: toNullableString(raw.answeredAt),
    scoreUrl: String(raw.scoreUrl ?? ""),
  };
}

function mapGradedBy(raw: unknown): { id: string; name: string | null } | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const grader = raw as Raw;
  if (grader.id === null || grader.id === undefined) {
    return null;
  }
  return { id: String(grader.id), name: toNullableString(grader.name) };
}

/** Map the teacher-facing pages/answer payload, preserving grading fields for regrade display. */
export function mapGradingAnswer(raw: Raw): GradingAnswer {
  return {
    attemptId: String(raw.attemptId),
    examQuestionId: String(raw.examQuestionId),
    answerId: String(raw.answerId),
    answerMode: raw.answerMode as GradingAnswer["answerMode"],
    gradingStatus: raw.gradingStatus as GradingAnswer["gradingStatus"],
    pages: Array.isArray(raw.pages)
      ? raw.pages.map((page: Raw) => ({
          id: String(page.id),
          pageOrder: Number(page.pageOrder),
          capturedAt: toNullableString(page.capturedAt),
          width: toNullableNumber(page.width),
          height: toNullableNumber(page.height),
          mimeType: toNullableString(page.mimeType),
          url: String(page.url),
        }))
      : [],
    manualScore: toNullableNumber(raw.manualScore),
    feedback: toNullableString(raw.feedback),
    gradedBy: mapGradedBy(raw.gradedBy),
    gradedAt: toNullableString(raw.gradedAt),
  };
}

/** Map the grade-save response (nested `answer` + recalculated `attempt`). */
export function mapGradeResult(raw: Raw): GradeResult {
  const answer = typeof raw.answer === "object" && raw.answer !== null ? raw.answer : {};
  const attempt = typeof raw.attempt === "object" && raw.attempt !== null ? raw.attempt : {};

  return {
    answerId: answer.id === null || answer.id === undefined ? "" : String(answer.id),
    gradingStatus: answer.gradingStatus as GradeResult["gradingStatus"],
    manualScore: toNullableNumber(answer.manualScore),
    feedback: toNullableString(answer.feedback),
    gradedBy: mapGradedBy(answer.gradedBy),
    gradedAt: toNullableString(answer.gradedAt),
    attempt: {
      score: toNullableNumber(attempt.score),
      maxScore: toNullableNumber(attempt.maxScore),
      percentage: toNullableNumber(attempt.percentage),
      passed: Boolean(attempt.passed),
    },
  };
}

export type ScoreInputResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Validate a manual-score input against the same bounds the backend enforces
 * (`StoreManualGradeRequest`: min 0, max = question points). Empty input is
 * invalid so an accidental empty save can never erase a grade.
 */
export function parseScoreInput(raw: string, maxPoints: number): ScoreInputResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, error: "يرجى إدخال الدرجة." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: "يرجى إدخال رقم صحيح." };
  }
  if (value < 0) {
    return { ok: false, error: "الدرجة لا يمكن أن تكون سالبة." };
  }
  if (value > maxPoints) {
    return { ok: false, error: `الدرجة لا تتجاوز ${maxPoints} نقطة.` };
  }
  return { ok: true, value };
}

/** Human-readable date/time for answer rows and grade headers. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}