export type ExamEligibility = "available" | "completed" | "locked" | "unavailable";

export type ExamLockedReason =
  | "lesson_locked"
  | "max_attempts_reached"
  | "exam_not_published"
  | "no_questions"
  | "no_exam"
  | null;

export interface ExamEntry {
  examExists: boolean;
  examId: string | null;
  examTitle: string | null;
  description: string | null;
  duration: number | null;
  passingPercentage: number | null;
  questionCount: number | null;
  maxAttempts: number | null;
  previousAttempts: number;
  remainingAttempts: number | null;
  bestScore: number | null;
  eligibility: ExamEligibility;
  lockedReason: ExamLockedReason;
  canStart: boolean;
}
