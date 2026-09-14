"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { resolveStudentAccessToken } from "@/services/api/tenant-student-fetch";
import { STAGE_COURSES_QUERY_KEY, STAGE_ENROLLED_KEY, STAGE_QUERY_KEY } from "./constants";
import { stageCoursesService } from "./services";
import type { StageCourseFilters } from "./types";

export const stageKeys = {
  stage: (id: number) => [STAGE_QUERY_KEY, "public", id] as const,
  courses: (stageId: number, filters: StageCourseFilters, page: number) =>
    [STAGE_COURSES_QUERY_KEY, stageId, filters, page] as const,
};

/**
 * Enrollment is per-identity. Tag the enrolled-courses key with the resolved
 * credential so a teacher's enrollment never leaks into the student's card view
 * (and vice versa) when both sessions coexist in the same browser.
 */
function enrollmentSessionTag(): string {
  const token = resolveStudentAccessToken();
  if (!token) return "anon";
  const id = token.split("|")[0];
  return id ? `user:${id}` : "anon";
}

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

/**
 * The signed-in student's enrolled courses, used to flip course cards from a
 * "subscribe now" CTA to a subscribed state. Returns an empty list for guests.
 */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: [STAGE_ENROLLED_KEY, "enrolled", enrollmentSessionTag()],
    queryFn: stageCoursesService.getEnrolledCourses,
    staleTime: 60_000,
  });
}
