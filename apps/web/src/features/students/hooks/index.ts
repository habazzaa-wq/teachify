"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "../services";
import { STUDENTS_QUERY_KEY } from "../constants";
import type { StudentFilterParams, CreateStudentPayload, InviteStudentPayload } from "../types";

export function useStudents(params?: StudentFilterParams) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, "list", params],
    queryFn: () => studentsService.list(params),
  });
}

export function useStudentMetrics() {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, "metrics"],
    queryFn: () => studentsService.getMetrics(),
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, "detail", id],
    queryFn: () => studentsService.getById(id!),
    enabled: !!id,
  });
}

export function useStudentEnrollments(id: string | null) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, "enrollments", id],
    queryFn: () => studentsService.getEnrollments(id!),
    enabled: !!id,
  });
}

export function useStudentAnalytics(id: string | null) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, "analytics", id],
    queryFn: () => studentsService.getAnalytics(id!),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentPayload) => studentsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
    },
  });
}

export function useInviteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteStudentPayload) => studentsService.invite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => studentsService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
    },
  });
}
