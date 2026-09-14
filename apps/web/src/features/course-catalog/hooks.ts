"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { resolveStudentAccessToken } from "@/services/api/tenant-student-fetch";
import { catalogKeys } from "./keys";
import { catalogService } from "./services";
import { CATALOG_ENROLLED_KEY } from "./constants";
import type { CatalogFilters } from "./types";

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

export function useCatalogStages() {
  return useQuery({
    queryKey: catalogKeys.stages,
    queryFn: catalogService.getStages,
    staleTime: 30_000,
  });
}

export function useCatalogCourses(filters: CatalogFilters, page: number) {
  return useQuery({
    queryKey: catalogKeys.courses(filters, page),
    queryFn: () => catalogService.getCourses(filters, page),
    placeholderData: keepPreviousData,
  });
}

/**
 * The signed-in student's enrolled courses, used to flip course cards from a
 * "subscribe now" CTA to a subscribed state. Returns an empty list for guests.
 */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: [CATALOG_ENROLLED_KEY, "enrolled", enrollmentSessionTag()],
    queryFn: catalogService.getEnrolledCourses,
    staleTime: 60_000,
  });
}
