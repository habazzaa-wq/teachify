"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { STAGE_COURSES_QUERY_KEY, STAGE_QUERY_KEY } from "./constants";
import { stageCoursesService } from "./services";
import type { StageCourseFilters } from "./types";

export const stageKeys = {
  stage: (id: number) => [STAGE_QUERY_KEY, "public", id] as const,
  courses: (stageId: number, filters: StageCourseFilters, page: number) =>
    [STAGE_COURSES_QUERY_KEY, stageId, filters, page] as const,
};

export function useStage(stageId: number) {
  return useQuery({
    queryKey: stageKeys.stage(stageId),
    queryFn: () => stageCoursesService.getStage(stageId),
    enabled: Number.isFinite(stageId) && stageId > 0,
    staleTime: 30_000,
  });
}

export function useStageCourses(
  stageId: number,
  filters: StageCourseFilters,
  page: number,
) {
  return useQuery({
    queryKey: stageKeys.courses(stageId, filters, page),
    queryFn: () => stageCoursesService.getCourses(stageId, filters, page),
    enabled: Number.isFinite(stageId) && stageId > 0,
    placeholderData: keepPreviousData,
  });
}
