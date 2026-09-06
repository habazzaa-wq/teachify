"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "../services";
import { COURSES_QUERY_KEY } from "../constants";
import type { CourseFilterParams, CreateCoursePayload, UpdateCoursePayload } from "../types";

const SECTIONS_QUERY_KEY = "course-sections";
const LESSONS_QUERY_KEY = "lessons";

export function useCourses(params?: CourseFilterParams) {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "list", params],
    queryFn: () => coursesService.list(params),
  });
}

export function useCourse(id: string | null) {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "detail", id],
    queryFn: () => coursesService.getById(id!),
    enabled: !!id,
  });
}

export function useCoursesMetrics() {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "metrics"],
    queryFn: () => coursesService.getMetrics(),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoursePayload) => coursesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoursePayload }) =>
      coursesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useArchiveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useRestoreCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useDuplicateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.toggleFeature(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useExportCourses() {
  return useMutation({
    mutationFn: () => coursesService.exportCsv(),
  });
}
