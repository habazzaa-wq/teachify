import { api } from "@/services/api";
import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type {
  CertificateApplication,
  CertificateEligibility,
  CertificateTemplate,
  CourseCertificateRule,
  IssuedCertificate,
} from "../types";

export const certificatesService = {
  async listTemplates(): Promise<CertificateTemplate[]> {
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

  async getCourseRule(courseId: number | string): Promise<CourseCertificateRule | null> {
    const { data } = await api.get(`/courses/${courseId}/certificate-rule`);
    return data.rule ?? null;
  },

  async updateCourseRule(courseId: number | string, payload: Partial<CourseCertificateRule>): Promise<CourseCertificateRule> {
    const { data } = await api.put(`/courses/${courseId}/certificate-rule`, payload);
    return data.rule;
  },

  async listApplications(params?: Record<string, string | number | undefined>): Promise<{ data: CertificateApplication[]; meta?: any }> {
    const { data } = await api.get("/certificates/applications", { params });
    const apps = data.applications;
    return Array.isArray(apps) ? { data: apps } : { data: apps?.data ?? [], meta: apps };
  },

  async approveApplication(id: number | string, payload: { admin_note?: string; issue_and_send?: boolean }): Promise<CertificateApplication> {
    const { data } = await api.post(`/certificates/applications/${id}/approve`, payload);
    return data.application;
  },

  async rejectApplication(id: number | string, payload: { admin_note?: string }): Promise<CertificateApplication> {
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

  async applyForCertificate(enrollmentId: number | string, note?: string): Promise<CertificateApplication> {
    const json = await tenantStudentFetch<{ application: CertificateApplication }>("/certificates/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment_id: enrollmentId, note }),
    });
    return json.application;
  },
};
