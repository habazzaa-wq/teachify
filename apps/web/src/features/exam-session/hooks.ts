"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examSessionService } from "./services";
import { EXAM_SESSION_QUERY_KEY } from "./constants";

export function useExamSession(attemptId: string | null) {
  return useQuery({
    queryKey: [EXAM_SESSION_QUERY_KEY, attemptId],
    queryFn: () => examSessionService.get(attemptId!),
    enabled: !!attemptId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useStartExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => examSessionService.start(lessonId),
    onSuccess: (session) => {
      queryClient.setQueryData(
        [EXAM_SESSION_QUERY_KEY, session.attempt.id],
        session,
      );
    },
  });
}

export function useSubmitExam(attemptId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => examSessionService.submit(attemptId!),
    onSuccess: (session) => {
      queryClient.setQueryData(
        [EXAM_SESSION_QUERY_KEY, session.attempt.id],
        session,
      );
    },
  });
}
