import type {
  ExamSessionAnswer,
  ExamSessionQuestion,
  ExamSessionQuestionType,
} from "./types";
import { TIMER_TONES, TIMER_WARNING_SECONDS } from "./constants";

/** Format a remaining-seconds value as HH:MM:SS (or MM:SS under an hour). */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${mm}:${ss}`
    : `${mm}:${ss}`;
}

/** Map a remaining-seconds value to a timer color tone. */
export function getTimerTone(totalSeconds: number): keyof typeof TIMER_TONES {
  if (totalSeconds <= TIMER_WARNING_SECONDS[2]) return "critical";
  if (totalSeconds <= TIMER_WARNING_SECONDS[1]) return "danger";
  if (totalSeconds <= TIMER_WARNING_SECONDS[0]) return "warning";
  return "safe";
}

/** Whether the stored answer for a question is effectively empty. */
export function isAnswerEmpty(answer: ExamSessionAnswer, type: ExamSessionQuestionType): boolean {
  if (type === "true_false" || type === "numeric") return typeof answer !== "string" || answer.length === 0;
  return !Array.isArray(answer) || answer.length === 0;
}

/** Toggle an option id for a multiple-choice answer (no-op for other types). */
export function toggleMultiOption(
  question: ExamSessionQuestion,
  optionId: string,
): ExamSessionAnswer {
  if (question.type !== "multiple_choice") return question.answer ?? [];
  const current = Array.isArray(question.answer) ? question.answer : [];
  return current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
}
