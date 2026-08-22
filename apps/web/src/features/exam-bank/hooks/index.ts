import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";
import { EXAM_BANK_QUERY_KEY } from "../constants";
import { examBankService } from "../services";
import type {
  Exam,
  ExamAnalytics,
  ExamAnalyticsOverview,
  ExamFilterParams,
  ExamQuestion,
  Question,
  QuestionBank,
  QuestionCategory,
  QuestionFilterParams,
} from "../types";

function invalidateAll(qc: ReturnType<typeof useQueryClient>, keys: string[] = []) {
  qc.invalidateQueries({ queryKey: [EXAM_BANK_QUERY_KEY, ...keys] });
}

type ExamToggleField = "pinned" | "featured" | "favorite";

function flipExamField(value: unknown, id: string | number, field: ExamToggleField): unknown {
  if (Array.isArray(value)) {
    return value.map((e: Record<string, unknown>) =>
      String(e.id) === String(id) ? { ...e, [field]: !e[field] } : e,
    );
  }
  if (value && typeof value === "object") {
    if ("data" in (value as Record<string, unknown>)) {
      return {
        ...(value as Record<string, unknown>),
        data: flipExamField((value as Record<string, unknown>).data, id, field),
      };
    }
    const entry = value as Record<string, unknown>;
    if (String(entry.id) === String(id)) {
      return { ...entry, [field]: !entry[field] };
    }
  }
  return value;
}

function optimisticToggleExam(
  qc: ReturnType<typeof useQueryClient>,
  field: ExamToggleField,
) {
  return {
    onMutate: async (id: string | number) => {
      await qc.cancelQueries({ queryKey: [EXAM_BANK_QUERY_KEY, "exams"] });
      const previous = qc.getQueriesData({ queryKey: [EXAM_BANK_QUERY_KEY, "exams"] });
      qc.setQueriesData({ queryKey: [EXAM_BANK_QUERY_KEY, "exams"] }, (old: unknown) =>
        flipExamField(old, id, field),
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      ctx: { previous?: Array<[QueryKey, unknown]> } | undefined,
    ) => {
      ctx?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(qc),
  };
}

// ---------------- Exams ----------------
export function useExams(params?: ExamFilterParams) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "list", params],
    queryFn: () => examBankService.listExams(params),
  });
}

export function useExam(id: string | number | null) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "detail", id],
    queryFn: () => examBankService.getExam(id as string | number),
    enabled: id !== null && id !== undefined,
  });
}

export function useRecentExams() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "recent"],
    queryFn: () => examBankService.recentExams(),
  });
}

export function usePinnedExams() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "pinned"],
    queryFn: () => examBankService.pinnedExams(),
  });
}

export function useFavoriteExams() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "favorites"],
    queryFn: () => examBankService.favoriteExams(),
  });
}

export function useExamMetrics() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "metrics"],
    queryFn: () => examBankService.examMetrics(),
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => examBankService.createExam(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      examBankService.updateExam(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.deleteExam(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRestoreExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.restoreExam(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDuplicateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.duplicateExam(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.publishExam(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useArchiveExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.archiveExam(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useTogglePinnedExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.togglePinned(id),
    ...optimisticToggleExam(qc, "pinned"),
  });
}

export function useToggleFeaturedExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.toggleFeatured(id),
    ...optimisticToggleExam(qc, "featured"),
  });
}

export function useToggleFavoriteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.toggleFavorite(id),
    ...optimisticToggleExam(qc, "favorite"),
  });
}

export function useBulkExamAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (op: {
      type: "delete" | "restore" | "duplicate" | "archive" | "publish";
      ids: number[];
    }) => {
      switch (op.type) {
        case "delete":
          await examBankService.bulkDeleteExams(op.ids);
          break;
        case "restore":
          await examBankService.bulkRestoreExams(op.ids);
          break;
        case "duplicate":
          await examBankService.bulkDuplicateExams(op.ids);
          break;
        case "archive":
          await examBankService.bulkArchiveExams(op.ids);
          break;
        case "publish":
          await examBankService.bulkPublishExams(op.ids);
          break;
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// ---------------- Exam questions ----------------
export function useExamQuestions(examId: string | number | null) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "exams", "questions", examId],
    queryFn: () => examBankService.getExamQuestions(examId as string | number),
    enabled: examId !== null && examId !== undefined,
  });
}

export function useAddExamQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: { question_id: number; section?: string; points?: number } }) =>
      examBankService.addExamQuestion(id, payload),
    onSuccess: () => invalidateAll(qc, ["exams"]),
  });
}

export function useSetExamQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string | number; items: Array<{ question_id: number; section?: string; points?: number }> }) =>
      examBankService.setExamQuestions(id, items),
    onSuccess: () => invalidateAll(qc, ["exams"]),
  });
}

export function useReorderExamQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, order }: { id: string | number; order: number[] }) =>
      examBankService.reorderExamQuestions(id, order),
    onSuccess: () => invalidateAll(qc, ["exams"]),
  });
}

export function useUpdateExamQuestionLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, questionId, payload }: { id: string | number; questionId: string | number; payload: { section?: string; points?: number; order?: number } }) =>
      examBankService.updateExamQuestionLink(id, questionId, payload),
    onSuccess: () => invalidateAll(qc, ["exams"]),
  });
}

export function useRemoveExamQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, questionId }: { id: string | number; questionId: string | number }) =>
      examBankService.removeExamQuestion(id, questionId),
    onSuccess: () => invalidateAll(qc, ["exams"]),
  });
}

// ---------------- Questions ----------------
export function useQuestions(params?: QuestionFilterParams) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "questions", "list", params],
    queryFn: () => examBankService.listQuestions(params),
  });
}

export function useQuestion(id: string | number | null) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "questions", "detail", id],
    queryFn: () => examBankService.getQuestion(id as string | number),
    enabled: id !== null && id !== undefined,
  });
}

export function useQuestionMetrics() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "questions", "metrics"],
    queryFn: () => examBankService.questionMetrics(),
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => examBankService.createQuestion(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      examBankService.updateQuestion(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.deleteQuestion(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRestoreQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.restoreQuestion(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDuplicateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.duplicateQuestion(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function usePublishQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.publishQuestion(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useArchiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.archiveQuestion(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUploadQuestionScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string | number; file: File }) =>
      examBankService.uploadScan(id, file),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRemoveQuestionScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.removeScan(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useBulkQuestionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (op: {
      type: "delete" | "restore" | "duplicate" | "archive" | "move";
      ids: number[];
      categoryId?: number;
      bankId?: number | null;
    }) => {
      switch (op.type) {
        case "delete":
          await examBankService.bulkDeleteQuestions(op.ids);
          break;
        case "restore":
          await examBankService.bulkRestoreQuestions(op.ids);
          break;
        case "duplicate":
          await examBankService.bulkDuplicateQuestions(op.ids);
          break;
        case "archive":
          await examBankService.bulkArchiveQuestions(op.ids);
          break;
        case "move":
          await examBankService.bulkMoveQuestions(op.ids, op.categoryId as number, op.bankId ?? null);
          break;
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// ---------------- Categories ----------------
export function useCategories(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "categories", "list", params],
    queryFn: () => examBankService.listCategories(params),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "categories", "tree"],
    queryFn: () => examBankService.categoryTree(),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => examBankService.createCategory(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      examBankService.updateCategory(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.deleteCategory(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRestoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.restoreCategory(id),
    onSuccess: () => invalidateAll(qc),
  });
}

// ---------------- Banks ----------------
export function useBanks(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "banks", "list", params],
    queryFn: () => examBankService.listBanks(params),
  });
}

export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => examBankService.createBank(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      examBankService.updateBank(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => examBankService.deleteBank(id),
    onSuccess: () => invalidateAll(qc),
  });
}

// ---------------- Analytics ----------------
export function useExamAnalyticsOverview() {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "analytics", "overview"],
    queryFn: () => examBankService.analyticsOverview(),
  });
}

export function useExamAnalytics(id: string | number | null) {
  return useQuery({
    queryKey: [EXAM_BANK_QUERY_KEY, "analytics", "exam", id],
    queryFn: () => examBankService.examAnalytics(id as string | number),
    enabled: id !== null && id !== undefined,
  });
}

export type {
  Exam,
  ExamAnalytics,
  ExamAnalyticsOverview,
  ExamQuestion,
  Question,
  QuestionBank,
  QuestionCategory,
};

// ---- Structured question imports ----

export function useCreateQuestionImport() {
  return useMutation({
    mutationFn: ({ file, mode }: { file: File; mode?: string }) =>
      examBankService.createQuestionImport(file, mode ?? "auto"),
  });
}

export function useRetryQuestionImport() {
  return useMutation({
    mutationFn: (uuid: string) => examBankService.retryQuestionImport(uuid),
  });
}

export function useDeleteQuestionImport() {
  return useMutation({
    mutationFn: (uuid: string) => examBankService.deleteQuestionImport(uuid),
  });
}
