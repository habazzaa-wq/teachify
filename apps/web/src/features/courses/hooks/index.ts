"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService, formatCourse } from "../services";
import { COURSES_QUERY_KEY } from "../constants";
import type { CourseFilterParams, CreateCoursePayload, UpdateCoursePayload } from "../types";
import { instructorApi } from "@/features/instructors/api";

const SECTIONS_QUERY_KEY = "course-sections";
const LESSONS_QUERY_KEY = "lessons";

export function useCourses(params?: CourseFilterParams, instructorToken?: string | null) {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "list", instructorToken ? "instructor" : "tenant", params],
    queryFn: () => instructorToken ? instructorApi.listCourses(instructorToken, params) : coursesService.list(params),
  });
}

export function useCourse(id: string | null, instructorToken?: string | null) {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "detail", instructorToken ? "instructor" : "tenant", id],
    queryFn: async () => {
      if (!id) return null;
      if (instructorToken) return formatCourse((await instructorApi.getCourse(instructorToken, id)).data);
      return coursesService.getById(id);
    },
    enabled: !!id,
  });
}

export function useCoursesMetrics(instructorToken?: string | null) {
  return useQuery({
    queryKey: [COURSES_QUERY_KEY, "metrics", instructorToken ? "instructor" : "tenant"],
    queryFn: () => instructorToken ? instructorApi.courseMetrics(instructorToken) : coursesService.getMetrics(),
  });
}

export function useCreateCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoursePayload) => instructorToken ? instructorApi.createCourse(instructorToken, data) : coursesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useUpdateCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoursePayload }) =>
      instructorToken ? instructorApi.updateCourse(instructorToken, id, data) : coursesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useDeleteCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.deleteCourse(instructorToken, id) : coursesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function usePublishCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.publishCourse(instructorToken, id) : coursesService.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useArchiveCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.archiveCourse(instructorToken, id) : coursesService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useRestoreCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.restoreCourse(instructorToken, id) : coursesService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useDuplicateCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.duplicateCourse(instructorToken, id) : coursesService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureCourse(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorToken ? instructorApi.toggleCourseFeature(instructorToken, id) : coursesService.toggleFeature(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
    },
  });
}

function invalidateCourseQueries(qc: ReturnType<typeof useQueryClient>): void {
  qc.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] });
  qc.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
  qc.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
}

export function useBulkPublishCourses(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => instructorToken ? instructorApi.bulkCourseAction(instructorToken, "publish", ids) : coursesService.bulkPublish(ids),
    onSuccess: () => invalidateCourseQueries(qc),
  });
}

export function useBulkArchiveCourses(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => instructorToken ? instructorApi.bulkCourseAction(instructorToken, "archive", ids) : coursesService.bulkArchive(ids),
    onSuccess: () => invalidateCourseQueries(qc),
  });
}

export function useBulkRestoreCourses(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => instructorToken ? instructorApi.bulkCourseAction(instructorToken, "restore", ids) : coursesService.bulkRestore(ids),
    onSuccess: () => invalidateCourseQueries(qc),
  });
}

export function useBulkDeleteCourses(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => instructorToken ? instructorApi.bulkCourseAction(instructorToken, "delete", ids) : coursesService.bulkDelete(ids),
    onSuccess: () => invalidateCourseQueries(qc),
  });
}

export function useBulkToggleFeatureCourses(instructorToken?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => instructorToken ? instructorApi.bulkCourseAction(instructorToken, "feature", ids) : coursesService.bulkToggleFeature(ids),
    onSuccess: () => invalidateCourseQueries(qc),
  });
}

export function useExportCourses(instructorToken?: string | null) {
  return useMutation({
    mutationFn: () => instructorToken ? instructorApi.exportCourses(instructorToken) : coursesService.exportCsv(),
  });
}
