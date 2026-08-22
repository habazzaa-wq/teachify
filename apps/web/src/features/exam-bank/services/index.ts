import { api } from "@/services/api";
import type { QuestionImportStatus } from "./import-types";
import type {
  Exam,
  ExamAnalytics,
  ExamAnalyticsOverview,
  ExamFilterParams,
  ExamQuestion,
  PaginatedList,
  Question,
  QuestionBank,
  QuestionCategory,
  QuestionFilterParams,
  QuestionType,
} from "../types";

function buildParams(params?: Record<string, unknown>): Record<string, string> {
  const q: Record<string, string> = {};
  if (!params) return q;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) q[key] = value.join(",");
    } else if (typeof value === "boolean") {
      q[key] = value ? "true" : "false";
    } else {
      q[key] = String(value);
    }
  }
  return q;
}

export const examBankService = {
  // ---- Exams ----
  async listExams(params?: ExamFilterParams): Promise<PaginatedList<Exam>> {
    const { data } = await api.get("/exam-bank/exams", { params: buildParams(params as Record<string, unknown>) });
    return {
      data: (data.data ?? []).map((e: Exam) => e),
      total: Number(data.total ?? 0),
      perPage: Number(data.per_page ?? 24),
      currentPage: Number(data.current_page ?? 1),
      lastPage: Number(data.last_page ?? 1),
    };
  },
  async getExam(id: string | number): Promise<Exam> {
    const { data } = await api.get(`/exam-bank/exams/${id}`);
    return data.data as Exam;
  },
  async createExam(payload: Record<string, unknown>): Promise<Exam> {
    const { data } = await api.post("/exam-bank/exams", payload);
    return data.data as Exam;
  },
  async updateExam(id: string | number, payload: Record<string, unknown>): Promise<Exam> {
    const { data } = await api.put(`/exam-bank/exams/${id}`, payload);
    return data.data as Exam;
  },
  async deleteExam(id: string | number): Promise<void> {
    await api.delete(`/exam-bank/exams/${id}`);
  },
  async setExamStatus(id: string | number, status: string): Promise<Exam> {
    const { data } = await api.patch(`/exam-bank/exams/${id}/status`, { status });
    return data.data as Exam;
  },
  async publishExam(id: string | number): Promise<Exam> {
    const { data } = await api.patch(`/exam-bank/exams/${id}/publish`);
    return data.data as Exam;
  },
  async archiveExam(id: string | number): Promise<Exam> {
    const { data } = await api.patch(`/exam-bank/exams/${id}/archive`);
    return data.data as Exam;
  },
  async restoreExam(id: string | number): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/restore`);
    return data.data as Exam;
  },
  async duplicateExam(id: string | number): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/duplicate`);
    return data.data as Exam;
  },
  async togglePinned(id: string | number): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/pin`);
    return data.data as Exam;
  },
  async toggleFeatured(id: string | number): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/feature`);
    return data.data as Exam;
  },
  async toggleFavorite(id: string | number): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/favorite`);
    return data.data as Exam;
  },
  async bulkDeleteExams(ids: number[]): Promise<void> {
    await api.post("/exam-bank/exams/bulk/delete", { ids });
  },
  async bulkRestoreExams(ids: number[]): Promise<void> {
    await api.post("/exam-bank/exams/bulk/restore", { ids });
  },
  async bulkDuplicateExams(ids: number[]): Promise<Exam[]> {
    const { data } = await api.post("/exam-bank/exams/bulk/duplicate", { ids });
    return (data.data ?? []).map((e: Exam) => e);
  },
  async bulkArchiveExams(ids: number[]): Promise<void> {
    await api.post("/exam-bank/exams/bulk/archive", { ids });
  },
  async bulkPublishExams(ids: number[]): Promise<void> {
    await api.post("/exam-bank/exams/bulk/publish", { ids });
  },
  async recentExams(): Promise<Exam[]> {
    const { data } = await api.get("/exam-bank/exams/recent");
    return (data.data ?? []).map((e: Exam) => e);
  },
  async pinnedExams(): Promise<Exam[]> {
    const { data } = await api.get("/exam-bank/exams/pinned");
    return (data.data ?? []).map((e: Exam) => e);
  },
  async favoriteExams(): Promise<Exam[]> {
    const { data } = await api.get("/exam-bank/exams/favorites");
    return (data.data ?? []).map((e: Exam) => e);
  },
  async examMetrics(): Promise<Record<string, number>> {
    const { data } = await api.get("/exam-bank/exams/metrics");
    return (data.data ?? {}) as Record<string, number>;
  },

  // ---- Exam questions ----
  async getExamQuestions(id: string | number): Promise<ExamQuestion[]> {
    const { data } = await api.get(`/exam-bank/exams/${id}/questions`);
    return (data.data ?? []).map((q: ExamQuestion) => q);
  },
  async addExamQuestion(
    id: string | number,
    payload: { question_id: number; section?: string; points?: number },
  ): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/questions`, payload);
    return data.data as Exam;
  },
  async setExamQuestions(
    id: string | number,
    items: Array<{ question_id: number; section?: string; points?: number }>,
  ): Promise<Exam> {
    const { data } = await api.put(`/exam-bank/exams/${id}/questions`, { items });
    return data.data as Exam;
  },
  async reorderExamQuestions(id: string | number, order: number[]): Promise<Exam> {
    const { data } = await api.post(`/exam-bank/exams/${id}/questions/reorder`, { order });
    return data.data as Exam;
  },
  async updateExamQuestionLink(
    id: string | number,
    questionId: string | number,
    payload: { section?: string; points?: number; order?: number },
  ): Promise<Exam> {
    const { data } = await api.put(`/exam-bank/exams/${id}/questions/${questionId}`, payload);
    return data.data as Exam;
  },
  async removeExamQuestion(id: string | number, questionId: string | number): Promise<Exam> {
    const { data } = await api.delete(`/exam-bank/exams/${id}/questions/${questionId}`);
    return data.data as Exam;
  },

  // ---- Questions ----
  async listQuestions(params?: QuestionFilterParams): Promise<PaginatedList<Question>> {
    const { data } = await api.get("/exam-bank/questions", { params: buildParams(params as Record<string, unknown>) });
    return {
      data: (data.data ?? []).map((q: Question) => q),
      total: Number(data.total ?? 0),
      perPage: Number(data.per_page ?? 24),
      currentPage: Number(data.current_page ?? 1),
      lastPage: Number(data.last_page ?? 1),
    };
  },
  async getQuestion(id: string | number): Promise<Question> {
    const { data } = await api.get(`/exam-bank/questions/${id}`);
    return data.data as Question;
  },
  async createQuestion(payload: Record<string, unknown>): Promise<Question> {
    const { data } = await api.post("/exam-bank/questions", payload);
    return data.data as Question;
  },
  async updateQuestion(id: string | number, payload: Record<string, unknown>): Promise<Question> {
    const { data } = await api.put(`/exam-bank/questions/${id}`, payload);
    return data.data as Question;
  },
  async deleteQuestion(id: string | number): Promise<void> {
    await api.delete(`/exam-bank/questions/${id}`);
  },
  async setQuestionStatus(id: string | number, status: string): Promise<Question> {
    const { data } = await api.patch(`/exam-bank/questions/${id}/status`, { status });
    return data.data as Question;
  },
  async publishQuestion(id: string | number): Promise<Question> {
    const { data } = await api.patch(`/exam-bank/questions/${id}/publish`);
    return data.data as Question;
  },
  async archiveQuestion(id: string | number): Promise<Question> {
    const { data } = await api.patch(`/exam-bank/questions/${id}/archive`);
    return data.data as Question;
  },
  async restoreQuestion(id: string | number): Promise<Question> {
    const { data } = await api.post(`/exam-bank/questions/${id}/restore`);
    return data.data as Question;
  },
  async duplicateQuestion(id: string | number): Promise<Question> {
    const { data } = await api.post(`/exam-bank/questions/${id}/duplicate`);
    return data.data as Question;
  },
  async bulkDeleteQuestions(ids: number[]): Promise<void> {
    await api.post("/exam-bank/questions/bulk/delete", { ids });
  },
  async bulkRestoreQuestions(ids: number[]): Promise<void> {
    await api.post("/exam-bank/questions/bulk/restore", { ids });
  },
  async bulkDuplicateQuestions(ids: number[]): Promise<Question[]> {
    const { data } = await api.post("/exam-bank/questions/bulk/duplicate", { ids });
    return (data.data ?? []).map((q: Question) => q);
  },
  async bulkArchiveQuestions(ids: number[]): Promise<void> {
    await api.post("/exam-bank/questions/bulk/archive", { ids });
  },
  async bulkMoveQuestions(ids: number[], categoryId: number, bankId?: number | null): Promise<void> {
    await api.post("/exam-bank/questions/bulk/move-category", { ids, category_id: categoryId, bank_id: bankId ?? null });
  },
  async uploadScan(id: string | number, file: File, mode?: string): Promise<Question> {
    const formData = new FormData();
    formData.append("file", file);
    if (mode) formData.append("mode", mode);
    const { data } = await api.post(`/exam-bank/questions/${id}/scan`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as Question;
  },
  async removeScan(id: string | number): Promise<Question> {
    const { data } = await api.delete(`/exam-bank/questions/${id}/scan`);
    return data.data as Question;
  },

  // ---- Structured question imports (photo → editable document) ----
  async createQuestionImport(file: File): Promise<QuestionImportStatus> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/exam-bank/question-imports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as QuestionImportStatus;
  },
  async getQuestionImport(uuid: string): Promise<QuestionImportStatus> {
    const { data } = await api.get(`/exam-bank/question-imports/${uuid}`);
    return data.data as QuestionImportStatus;
  },
  async retryQuestionImport(uuid: string): Promise<QuestionImportStatus> {
    const { data } = await api.post(`/exam-bank/question-imports/${uuid}/retry`);
    return data.data as QuestionImportStatus;
  },
  async deleteQuestionImport(uuid: string): Promise<void> {
    await api.delete(`/exam-bank/question-imports/${uuid}`);
  },
  async validateQuestionDocument(documentJson: string): Promise<{ valid: boolean; errors: string[] }> {
    const { data } = await api.post("/exam-bank/question-imports/validate-document", {
      document: documentJson,
    });
    return (data.data ?? {}) as { valid: boolean; errors: string[] };
  },
  async questionMetrics(): Promise<{ total: number; published: number; draft: number; archived: number; byType: Record<string, number> }> {
    const { data } = await api.get("/exam-bank/questions/metrics");
    return (data.data ?? { byType: {} }) as { total: number; published: number; draft: number; archived: number; byType: Record<string, number> };
  },

  // ---- Categories ----
  async listCategories(params?: Record<string, unknown>): Promise<PaginatedList<QuestionCategory>> {
    const { data } = await api.get("/exam-bank/categories", { params: buildParams(params) });
    return {
      data: (data.data ?? []).map((c: QuestionCategory) => c),
      total: Number(data.total ?? 0),
      perPage: Number(data.per_page ?? 50),
      currentPage: Number(data.current_page ?? 1),
      lastPage: Number(data.last_page ?? 1),
    };
  },
  async categoryTree(): Promise<QuestionCategory[]> {
    const { data } = await api.get("/exam-bank/categories/tree");
    return (data.data ?? []).map((c: QuestionCategory) => c);
  },
  async createCategory(payload: Record<string, unknown>): Promise<QuestionCategory> {
    const { data } = await api.post("/exam-bank/categories", payload);
    return data.data as QuestionCategory;
  },
  async updateCategory(id: string | number, payload: Record<string, unknown>): Promise<QuestionCategory> {
    const { data } = await api.put(`/exam-bank/categories/${id}`, payload);
    return data.data as QuestionCategory;
  },
  async deleteCategory(id: string | number): Promise<void> {
    await api.delete(`/exam-bank/categories/${id}`);
  },
  async restoreCategory(id: string | number): Promise<QuestionCategory> {
    const { data } = await api.post(`/exam-bank/categories/${id}/restore`);
    return data.data as QuestionCategory;
  },

  // ---- Banks ----
  async listBanks(params?: Record<string, unknown>): Promise<PaginatedList<QuestionBank>> {
    const { data } = await api.get("/exam-bank/banks", { params: buildParams(params) });
    return {
      data: (data.data ?? []).map((b: QuestionBank) => b),
      total: Number(data.total ?? 0),
      perPage: Number(data.per_page ?? 25),
      currentPage: Number(data.current_page ?? 1),
      lastPage: Number(data.last_page ?? 1),
    };
  },
  async createBank(payload: Record<string, unknown>): Promise<QuestionBank> {
    const { data } = await api.post("/exam-bank/banks", payload);
    return data.data as QuestionBank;
  },
  async updateBank(id: string | number, payload: Record<string, unknown>): Promise<QuestionBank> {
    const { data } = await api.put(`/exam-bank/banks/${id}`, payload);
    return data.data as QuestionBank;
  },
  async setBankStatus(id: string | number, status: string): Promise<QuestionBank> {
    const { data } = await api.patch(`/exam-bank/banks/${id}/status`, { status });
    return data.data as QuestionBank;
  },
  async deleteBank(id: string | number): Promise<void> {
    await api.delete(`/exam-bank/banks/${id}`);
  },
  async restoreBank(id: string | number): Promise<QuestionBank> {
    const { data } = await api.post(`/exam-bank/banks/${id}/restore`);
    return data.data as QuestionBank;
  },

  // ---- Analytics ----
  async analyticsOverview(): Promise<ExamAnalyticsOverview> {
    const { data } = await api.get("/exam-bank/analytics/overview");
    return (data.data ?? { exams: {}, attempts: {}, questions: { total: 0, byType: {} } }) as ExamAnalyticsOverview;
  },
  async examAnalytics(id: string | number): Promise<ExamAnalytics> {
    const { data } = await api.get(`/exam-bank/exams/${id}/analytics`);
    return data.data as ExamAnalytics;
  },
};

export type { QuestionType };
