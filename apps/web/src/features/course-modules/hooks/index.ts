"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesService } from "../services";
import { MODULES_QUERY_KEY } from "../constants";
import type { ModuleFilterParams, CreateCourseModulePayload, UpdateCourseModulePayload } from "../types";

const SECTIONS_QUERY_KEY = "course-sections";
const LESSONS_QUERY_KEY = "lessons";
const COURSES_QUERY_KEY = "courses";

export function useModules(courseId: string | null, params?: ModuleFilterParams) {
  return useQuery({
    queryKey: [MODULES_QUERY_KEY, "list", courseId, params],
    queryFn: () => modulesService.list(courseId!, params),
    enabled: !!courseId,
  });
}

export function useModulesMetrics(courseId?: string) {
  return useQuery({
    queryKey: [MODULES_QUERY_KEY, "metrics", courseId],
    queryFn: () => modulesService.getMetrics(courseId),
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CreateCourseModulePayload }) =>
      modulesService.create(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id, data }: { courseId: string; id: string; data: UpdateCourseModulePayload }) =>
      modulesService.update(courseId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.delete(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function usePublishModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.publish(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useArchiveModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.archive(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.toggleFeature(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useRestoreModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.restore(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useDuplicateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) =>
      modulesService.duplicate(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useReorderModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, modules }: { courseId: string; modules: Array<{ id: number; order: number }> }) =>
      modulesService.reorder(courseId, modules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MODULES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
    },
  });
}

export function useExportModules() {
  return useMutation({
    mutationFn: (courseId: string) => modulesService.exportCsv(courseId),
  });
}
