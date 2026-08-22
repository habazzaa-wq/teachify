"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicCourseService } from "./services";
import { PUBLIC_COURSE_QUERY_KEY } from "./constants";
import { resolveStudentAccessToken } from "@/services/api/tenant-student-fetch";

/**
 * Enrollment is per-identity. Tag the key with the resolved credential so the
 * teacher's enrollment never leaks into the student's view (and vice versa)
 * when both sessions coexist in the same browser.
 */
function enrollmentSessionTag(): string {
  const token = resolveStudentAccessToken();
  if (!token) return "anon";
  const id = token.split("|")[0];
  return id ? `user:${id}` : "anon";
}

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

export function useEnrollmentCheck(slug: string | null, enabled = true) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "enrollment", slug, enrollmentSessionTag()],
    queryFn: () => publicCourseService.checkEnrollment(slug!),
    enabled: !!slug && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useLessonVideo(slug: string | null, lessonId: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "video", slug, lessonId],
    queryFn: () => publicCourseService.getLessonVideo(slug!, lessonId!),
    enabled: !!slug && !!lessonId,
    staleTime: 60 * 1000,
  });
}

export function useLessonFiles(slug: string | null, lessonId: string | null) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "files", slug, lessonId],
    queryFn: () => publicCourseService.getLessonFiles(slug!, lessonId!),
    enabled: !!slug && !!lessonId,
    staleTime: 60 * 1000,
  });
}

export function usePurchaseCourse(slug: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publicCourseService.purchaseCourse(slug!),
    onSuccess: (data) => {
      if (data.enrolled && slug) {
        queryClient.setQueryData(
          [PUBLIC_COURSE_QUERY_KEY, "enrollment", slug, enrollmentSessionTag()],
          {
            enrolled: true,
            enrollment: data.enrollment ?? null,
          },
        );
        queryClient.invalidateQueries({
          queryKey: [PUBLIC_COURSE_QUERY_KEY, "detail", slug],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
