"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificatesService } from "../services";
import type { CertificateTemplate } from "../types";

export const certificateKeys = {
  all: ["certificates"] as const,
  templates: () => [...certificateKeys.all, "templates"] as const,
  applications: (params?: Record<string, unknown>) => [...certificateKeys.all, "applications", params] as const,
  myCertificates: () => [...certificateKeys.all, "my-certificates"] as const,
  myApplications: () => [...certificateKeys.all, "my-applications"] as const,
  eligibility: (enrollmentId: string | number) => [...certificateKeys.all, "eligibility", enrollmentId] as const,
  courseRule: (courseId: string | number) => [...certificateKeys.all, "course-rule", courseId] as const,
  issued: (id: string | number) => [...certificateKeys.all, "issued", id] as const,
};

export function useCertificateTemplates() {
  return useQuery({ queryKey: certificateKeys.templates(), queryFn: () => certificatesService.listTemplates() });
}

export function useCertificateApplications(params?: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: certificateKeys.applications(params), queryFn: () => certificatesService.listApplications(params) });
}

export function useMyCertificates() {
  return useQuery({ queryKey: certificateKeys.myCertificates(), queryFn: () => certificatesService.myCertificates() });
}

export function useMyCertificateApplications() {
  return useQuery({ queryKey: certificateKeys.myApplications(), queryFn: () => certificatesService.myApplications() });
}

export function useEnrollmentCertificateEligibility(enrollmentId: string | number | null) {
  return useQuery({
    queryKey: certificateKeys.eligibility(enrollmentId ?? "none"),
    queryFn: () => certificatesService.enrollmentEligibility(enrollmentId!),
    enabled: !!enrollmentId,
  });
}

export function useCourseCertificateRule(courseId: string | number | null) {
  return useQuery({
    queryKey: certificateKeys.courseRule(courseId ?? "none"),
    queryFn: () => certificatesService.getCourseRule(courseId!),
    enabled: !!courseId,
  });
}

export function useCreateCertificateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: certificatesService.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.templates() }),
  });
}

export function useUpdateCertificateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<CertificateTemplate> }) => certificatesService.updateTemplate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.templates() }),
  });
}

export function useUpdateCertificateTemplateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) => certificatesService.updateTemplateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.templates() }),
  });
}

export function useDeleteCertificateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => certificatesService.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.templates() }),
  });
}

export function useUpdateCourseCertificateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: number | string; payload: Record<string, unknown> }) => certificatesService.updateCourseRule(courseId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: certificateKeys.courseRule(vars.courseId) });
      qc.invalidateQueries({ queryKey: certificateKeys.applications() });
    },
  });
}

export function useApproveCertificateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number | string;
      payload: { admin_note?: string; issue_and_send?: boolean; requirement_reviews?: Record<string, { status: string; note?: string }> };
    }) => certificatesService.approveApplication(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useRejectCertificateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: { admin_note?: string } }) =>
      certificatesService.rejectApplication(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}

export function useIssueCertificateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => certificatesService.issueApplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}

export function useApplyForCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, note, submissions }: { enrollmentId: number | string; note?: string; submissions?: Record<string, string> }) =>
      certificatesService.applyForCertificate(enrollmentId, note, submissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}
