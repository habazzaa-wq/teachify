"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { publicCourseService } from "./services";
import { PUBLIC_COURSE_QUERY_KEY } from "./constants";

export interface LessonVideoPayload {
  lesson: {
    id: string;
    title: string;
    slug?: string | null;
    lessonType?: string | null;
    shortDescription?: string | null;
    durationSeconds?: number | null;
  };
  video: {
    embed_url: string | null;
    playback_url: string | null;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    available_resolutions: string[];
    status?: string | null;
  } | null;
}

export interface LessonFileItem {
  id: string;
  title: string | null;
  description: string | null;
  downloadEnabled: boolean;
  fileName: string | null;
  mimeType?: string | null;
  extension?: string | null;
  sizeBytes: number | null;
  type?: string | null;
  url: string | null;
}

export function useLessonVideo(slug: string | null, lessonId: string) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "lesson-video", slug, lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/public/courses/${slug}/lessons/${lessonId}/video`);
      return (data.data ?? null) as LessonVideoPayload | null;
    },
    enabled: !!slug && !!lessonId,
    staleTime: 60 * 1000,
  });
}

export function useLessonFiles(slug: string | null, lessonId: string) {
  return useQuery({
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "lesson-files", slug, lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/public/courses/${slug}/lessons/${lessonId}/files`);
      return { files: ((data.data?.files ?? []) as LessonFileItem[]) };
    },
    enabled: !!slug && !!lessonId,
    staleTime: 60 * 1000,
  });
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
    queryKey: [PUBLIC_COURSE_QUERY_KEY, "enrollment", slug],
    queryFn: () => publicCourseService.checkEnrollment(slug!),
    enabled: !!slug && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePurchaseCourse(slug: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publicCourseService.purchaseCourse(slug!),
    onSuccess: (data) => {
      if (data.enrolled && slug) {
        queryClient.setQueryData([PUBLIC_COURSE_QUERY_KEY, "enrollment", slug], {
          enrolled: true,
          enrollment: data.enrollment ?? null,
        });
        queryClient.invalidateQueries({
          queryKey: [PUBLIC_COURSE_QUERY_KEY, "detail", slug],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
