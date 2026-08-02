"use client";

import { useQuery } from "@tanstack/react-query";
import { examEntryService } from "./services";
import { EXAM_ENTRY_QUERY_KEY } from "./constants";

export function useExamEntry(lessonId: string | null, enabled = true) {
  return useQuery({
    queryKey: [EXAM_ENTRY_QUERY_KEY, "lesson", lessonId],
    queryFn: () => examEntryService.getByLesson(lessonId!),
    enabled: !!lessonId && enabled,
    staleTime: 2 * 60 * 1000,
  });
}
