"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsService } from "../services";
import { LESSONS_QUERY_KEY } from "../constants";
import type { LessonFilterParams, CreateLessonPayload, UpdateLessonPayload } from "../types";

const SECTIONS_QUERY_KEY = "course-sections";
const COURSES_QUERY_KEY = "courses";

export function useLessons(courseId: string | null, sectionId: string | null, params?: LessonFilterParams) {
  return useQuery({
    queryKey: [LESSONS_QUERY_KEY, "list", courseId, sectionId, params],
    queryFn: () => lessonsService.list(courseId!, sectionId!, params),
    enabled: !!courseId && !!sectionId,
  });
}

export function useLesson(courseId: string | null, sectionId: string | null, id: string | null) {
  return useQuery({
    queryKey: [LESSONS_QUERY_KEY, "detail", id],
    queryFn: () => lessonsService.getById(courseId!, sectionId!, id!),
    enabled: !!courseId && !!sectionId && !!id,
  });
}

export function useLessonsMetrics(courseId?: string, sectionId?: string) {
  return useQuery({
    queryKey: [LESSONS_QUERY_KEY, "metrics", courseId, sectionId],
    queryFn: () => lessonsService.getMetrics(courseId, sectionId),
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, data }: { courseId: string; sectionId: string; data: CreateLessonPayload }) =>
      lessonsService.create(courseId, sectionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id, data }: { courseId: string; sectionId: string; id: string; data: UpdateLessonPayload }) =>
      lessonsService.update(courseId, sectionId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.delete(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function usePublishLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.publish(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useArchiveLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.archive(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.toggleFeature(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useToggleFreePreview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.toggleFreePreview(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useRestoreLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.restore(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDuplicateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, id }: { courseId: string; sectionId: string; id: string }) =>
      lessonsService.duplicate(courseId, sectionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useReorderLessons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, lessons }: { courseId: string; sectionId: string; lessons: Array<{ id: number; sort_order: number }> }) =>
      lessonsService.reorder(courseId, sectionId, lessons),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useExportLessons() {
  return useMutation({
    mutationFn: ({ courseId, sectionId }: { courseId: string; sectionId: string }) =>
      lessonsService.exportCsv(courseId, sectionId),
  });
}
