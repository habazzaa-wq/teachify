import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MANUAL_GRADING_QUERY_KEY } from "./constants";
import { manualGradingService } from "./services";
import type { GradeResult, GradingAnswer } from "./types";

function queueKey(examId: string | number | null) {
  return [MANUAL_GRADING_QUERY_KEY, "queue", examId];
}

function answerKey(attemptId: string | number | null, examQuestionId: string | number | null) {
  return [MANUAL_GRADING_QUERY_KEY, "answer", attemptId, examQuestionId];
}

export function useGradingQueue(examId: string | number | null) {
  return useQuery({
    queryKey: [MANUAL_GRADING_QUERY_KEY, "queue", examId],
    queryFn: () => manualGradingService.gradingQueue(examId as string | number),
    enabled: examId !== null && examId !== undefined,
  });
}

export function useGradingAnswer(attemptId: string | number | null, examQuestionId: string | number | null) {
  return useQuery({
    queryKey: answerKey(attemptId, examQuestionId),
    queryFn: () => manualGradingService.getAnswer(attemptId as string | number, examQuestionId as string | number),
    enabled: attemptId !== null && examQuestionId !== null,
  });
}

interface SaveGradeVariables {
  examId: string | number;
  attemptId: string | number;
  examQuestionId: string | number;
  answerId: string | number;
  payload: { manual_score: number; feedback?: string | null };
}

export function useSaveGrade() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (variables: SaveGradeVariables) =>
      manualGradingService.saveGrade(variables.attemptId, variables.answerId, variables.payload),
    onSuccess: (result: GradeResult, variables: SaveGradeVariables) => {
      // The saved answer drops out of the pending queue (or its grading status
      // changes) - refetch so the list reflects the latest server state.
      qc.invalidateQueries({ queryKey: queueKey(variables.examId) });
      // Patch the open answer in place so the form shows the fresh grading
      // state (grader identity / gradedAt) without a stale local copy.
      qc.setQueryData<GradingAnswer>(answerKey(variables.attemptId, variables.examQuestionId), (old) =>
        old
          ? {
              ...old,
              gradingStatus: result.gradingStatus,
              manualScore: result.manualScore,
              feedback: result.feedback,
              gradedBy: result.gradedBy,
              gradedAt: result.gradedAt,
            }
          : old,
      );
    },
  });
}