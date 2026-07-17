"use client";

import { useQuery } from "@tanstack/react-query";
import { publicCourseService } from "./services";
import { PUBLIC_COURSE_QUERY_KEY } from "./constants";

export function usePublicCourse(slug: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "detail", slug],
    queryFn: () => publicCourseService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicCourseModules(slug: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "modules", slug],
    queryFn: () => publicCourseService.getModules(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRelatedCourses(slug: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "related", slug],
    queryFn: () => publicCourseService.getRelated(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEnrollmentCheck(slug: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "enrollment", slug],
    queryFn: () => publicCourseService.checkEnrollment(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}
