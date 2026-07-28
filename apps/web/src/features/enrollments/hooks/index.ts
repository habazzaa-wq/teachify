"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsService } from "../services";
import { ENROLLMENTS_QUERY_KEY } from "../constants";
import type { EnrollmentFilterParams } from "../types";

export function useEnrollments(params?: EnrollmentFilterParams) {
  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, "list", params],
    queryFn: () => enrollmentsService.list(params),
  });
}

export function useEnrollment(id: string | null) {
  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, "detail", id],
    queryFn: () => enrollmentsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; tenantUserId: string }) =>
      enrollmentsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
    },
  });
}
