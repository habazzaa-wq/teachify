import { api } from "@/services/api";
import { mapGradeResult, mapGradingAnswer, mapOverviewItem, mapQueueItem } from "./mappers";
import type { GradeResult, GradingAnswer, GradingOverviewItem, GradingQueueItem } from "./types";

export const manualGradingService = {
  /** Pending / partially-graded manual-review items for an exam. */
  async gradingQueue(examId: string | number): Promise<GradingQueueItem[]> {
    const { data } = await api.get(`/exams/${examId}/grading-queue`);
    return (data.data ?? []).map((item: Record<string, unknown>) => mapQueueItem(item));
  },

  /** Exams with answers awaiting teacher review, each with its pending count. */
  async gradingOverview(): Promise<GradingOverviewItem[]> {
    const { data } = await api.get("/exam-bank/grading/overview");
    return (data.data ?? []).map((item: Record<string, unknown>) => mapOverviewItem(item));
  },

  /** Teacher-facing answer view (pages + current grade state) for one exam question. */
  async getAnswer(
    attemptId: string | number,
    examQuestionId: string | number,
  ): Promise<GradingAnswer> {
    const { data } = await api.get(`/exam-attempts/${attemptId}/answers/${examQuestionId}/pages`);
    return mapGradingAnswer(data.data);
  },

  /** Save (or regrade) a manual score + optional feedback. */
  async saveGrade(
    attemptId: string | number,
    answerId: string | number,
    payload: { manual_score: number; feedback?: string | null },
  ): Promise<GradeResult> {
    const { data } = await api.put(`/exam-attempts/${attemptId}/answers/${answerId}/grade`, payload);
    return mapGradeResult(data.data);
  },

  /** Fetch one answer page as a blob for display (authenticated media route). */
  async fetchPageBlob(url: string): Promise<Blob> {
    const { data } = await api.get(url, { responseType: "blob", timeout: 60_000 });
    return data as Blob;
  },
};