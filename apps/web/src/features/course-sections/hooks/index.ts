"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionsService } from "../services";
import { SECTIONS_QUERY_KEY } from "../constants";
import type { SectionFilterParams, CreateCourseSectionPayload, UpdateCourseSectionPayload } from "../types";

const LESSONS_QUERY_KEY = "lessons";
const COURSES_QUERY_KEY = "courses";

export function useSections(courseId: string | null, params?: SectionFilterParams) {
  return useQuery({
    queryKey: [SECTIONS_QUERY_KEY, "list", courseId, params],
    queryFn: () => sectionsService.list(courseId!, params),
    enabled: !!courseId,
  });
}

export function useSectionsMetrics(courseId?: string) {
  return useQuery({
    queryKey: [SECTIONS_QUERY_KEY, "metrics", courseId],
    queryFn: () => sectionsService.getMetrics(courseId),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CreateCourseSectionPayload }) =>
      sectionsService.create(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id, data }: { courseId: string; id: string; data: UpdateCourseSectionPayload }) =>
      sectionsService.update(courseId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.delete(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function usePublishSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.publish(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useUnpublishSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.unpublish(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useToggleLockSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.toggleLock(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.toggleFeature(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useArchiveSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.archive(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useRestoreSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.restore(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDuplicateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      sectionsService.duplicate(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sections }: { courseId: string; sections: Array<{ id: number; sort_order: number }> }) =>
      sectionsService.reorder(courseId, sections),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useMoveSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      id,
      courseModuleId,
      sortOrder,
    }: {
      courseId: string;
      id: string;
      courseModuleId: string | null;
      sortOrder?: number;
    }) => sectionsService.move(courseId, id, { course_module_id: courseModuleId, sort_order: sortOrder }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useExportSections() {
  return useMutation({
    mutationFn: (courseId: string) => sectionsService.exportCsv(courseId),
  });
}
