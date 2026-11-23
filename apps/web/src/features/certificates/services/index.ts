import { resolveApiUrl } from "@/config/env";
import { api } from "@/services/api";
import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import { instructorApi } from "@/features/instructors/api";
import { useInstructorAuthStore } from "@/features/instructors/store";
import type {
  CertificateApplication,
  CertificateEligibility,
  CertificateTemplate,
  CourseCertificateRule,
  IssuedCertificate,
} from "../types";

/**
 * Certificates can be consumed from both the tenant workspace (/teacher/...) and
 * the instructor workspace (/instructor/...). Decide which API to call from the
 * current route, not from whether an instructor token happens to be stored:
 * an admin who previously logged in as an instructor keeps that token in
 * localStorage, and must still use the tenant routes.
 */
export function isInstructorCertificatesPath(pathname?: string | null): boolean {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/instructor/");
}

function instructorToken(): string | null {
  if (!isInstructorCertificatesPath()) return null;
  if (typeof window === "undefined") return null;
  return useInstructorAuthStore.getState().accessToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const certificatesService = {
  async listTemplates(): Promise<CertificateTemplate[]> {
    const token = instructorToken();
    if (token) {
      const { templates } = await instructorApi.certificateTemplates(token);
      return (templates ?? []) as CertificateTemplate[];
    }
    const { data } = await api.get("/certificates/templates");
    const templates = data.templates;
    return Array.isArray(templates) ? templates : (templates?.data ?? []);
  },

  async createTemplate(payload: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const { data } = await api.post("/certificates/templates", payload);
    return data.template;
  },

  async updateTemplate(id: number | string, payload: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const { data } = await api.put(`/certificates/templates/${id}`, payload);
    return data.template;
  },

  async updateTemplateStatus(id: number | string, status: string): Promise<CertificateTemplate> {
    const { data } = await api.patch(`/certificates/templates/${id}/status`, { status });
    return data.template;
  },

  async deleteTemplate(id: number | string): Promise<void> {
    await api.delete(`/certificates/templates/${id}`);
  },

  /**
   * Uploads a certificate asset (logo / seal / signature) into the tenant media
   * library and returns a public URL. `public` visibility is required because
   * issued certificates are viewable by students and by anyone with the QR link.
   */
  async uploadAsset(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("library", "media");
    form.append("visibility", "public");

    const { data } = await api.post<{
      data?: {
        cdn_url?: string;
        asset?: { cdn_url?: string; cdnUrl?: string };
      };
    }>("/media-library/upload/file", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });

    const uploaded = data?.data?.cdn_url ?? data?.data?.asset?.cdn_url ?? data?.data?.asset?.cdnUrl;
    if (!uploaded) throw new Error("لم يرجع الخادم رابط الصورة بعد الرفع.");

    try {
      return new URL(uploaded, resolveApiUrl()).toString();
    } catch {
      return uploaded;
    }
  },

  async getCourseRule(courseId: number | string): Promise<CourseCertificateRule | null> {
    const token = instructorToken();
    if (token) {
      const { rule } = await instructorApi.certificateRule(token, courseId);
      return (rule ?? null) as CourseCertificateRule | null;
    }
    const { data } = await api.get(`/courses/${courseId}/certificate-rule`);
    return data.rule ?? null;
  },

  async updateCourseRule(courseId: number | string, payload: Record<string, unknown>): Promise<CourseCertificateRule> {
    const token = instructorToken();
    if (token) {
      const { rule } = await instructorApi.updateCertificateRule(token, courseId, payload);
      return rule as CourseCertificateRule;
    }
    const { data } = await api.put(`/courses/${courseId}/certificate-rule`, payload);
    return data.rule;
  },

  async listApplications(params?: Record<string, string | number | undefined>): Promise<{ data: CertificateApplication[]; meta?: unknown }> {
    const token = instructorToken();
    if (token) {
      const { applications } = await instructorApi.certificateApplications(token, params);
      if (Array.isArray(applications)) return { data: applications as CertificateApplication[] };
      if (isRecord(applications)) return { data: (applications.data as CertificateApplication[]) ?? [], meta: applications };
      return { data: [] };
    }
    const { data } = await api.get("/certificates/applications", { params });
    const apps = data.applications;
    return Array.isArray(apps) ? { data: apps } : { data: apps?.data ?? [], meta: apps };
  },

  async approveApplication(id: number | string, payload: { admin_note?: string; issue_and_send?: boolean; requirement_reviews?: Record<string, { status: string; note?: string }> }): Promise<CertificateApplication> {
    const token = instructorToken();
    if (token) {
      const { application } = await instructorApi.certificateApprove(token, id, payload);
      return application as CertificateApplication;
    }
    const { data } = await api.post(`/certificates/applications/${id}/approve`, payload);
    return data.application;
  },

  async rejectApplication(id: number | string, payload: { admin_note?: string }): Promise<CertificateApplication> {
    const token = instructorToken();
    if (token) {
      const { application } = await instructorApi.certificateReject(token, id, payload);
      return application as CertificateApplication;
    }
    const { data } = await api.post(`/certificates/applications/${id}/reject`, payload);
    return data.application;
  },

  async issueApplication(id: number | string): Promise<CertificateApplication> {
    const { data } = await api.post(`/certificates/applications/${id}/issue`);
    return data.application;
  },

  async getIssuedCertificate(id: number | string): Promise<IssuedCertificate> {
    const { data } = await api.get(`/certificates/${id}`);
    return data.certificate;
  },

  async myCertificates(): Promise<IssuedCertificate[]> {
    const json = await tenantStudentFetch<{ certificates: IssuedCertificate[] }>("/certificates/me");
    return json.certificates ?? [];
  },

  async myApplications(): Promise<CertificateApplication[]> {
    const json = await tenantStudentFetch<{ applications: CertificateApplication[] }>("/certificates/applications/me");
    return json.applications ?? [];
  },

  async enrollmentEligibility(enrollmentId: number | string): Promise<CertificateEligibility> {
    return tenantStudentFetch<CertificateEligibility>(`/enrollments/${enrollmentId}/certificate-eligibility`);
  },

  async applyForCertificate(
    enrollmentId: number | string,
    note?: string,
    submissions?: Record<string, string>,
  ): Promise<CertificateApplication> {
    const json = await tenantStudentFetch<{ application: CertificateApplication }>("/certificates/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment_id: enrollmentId, note, submissions }),
    });
    return json.application;
  },
};
