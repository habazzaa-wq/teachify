import { api } from "@/services/api";
import type { ExamEntry } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Raw API responses have untyped shapes
type Raw = Record<string, any>;

function formatExamEntry(raw: Raw): ExamEntry {
  return {
    examExists: raw.examExists ?? false,
    examId: raw.examId ?? null,
    examTitle: raw.examTitle ?? null,
    description: raw.description ?? null,
    duration: raw.duration ?? null,
    passingPercentage: raw.passingPercentage ?? null,
    questionCount: raw.questionCount ?? null,
    maxAttempts: raw.maxAttempts ?? null,
    previousAttempts: raw.previousAttempts ?? 0,
    remainingAttempts: raw.remainingAttempts ?? null,
    bestScore: raw.bestScore ?? null,
    eligibility: raw.eligibility ?? "unavailable",
    lockedReason: raw.lockedReason ?? null,
    canStart: raw.canStart ?? false,
  };
}

export const examEntryService = {
  async getByLesson(lessonId: string): Promise<ExamEntry> {
    const { data } = await api.get(`/lessons/${lessonId}/exam-entry`);
    return formatExamEntry(data.data);
  },
};
