"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { examResultService } from "./services";
import { EXAM_HISTORY_QUERY_KEY, EXAM_RESULT_QUERY_KEY } from "./constants";

export function useExamResult(attemptId: string | null) {
  return useQuery({
    queryKey: [EXAM_RESULT_QUERY_KEY, attemptId],
    queryFn: () => examResultService.getResult(attemptId!),
    enabled: !!attemptId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAttemptHistory(examId: string | null) {
  return useQuery({
    queryKey: [EXAM_HISTORY_QUERY_KEY, examId],
    queryFn: () => examResultService.getHistory(examId!),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useStartPractice() {
  return useMutation({
    mutationFn: (attemptId: string) => examResultService.startPractice(attemptId),
  });
}
