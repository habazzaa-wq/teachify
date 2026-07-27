import { api } from "@/services/api";
import type { Enrollment, EnrollmentFilterParams } from "../types";

function formatEnrollment(raw: any): Enrollment {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? raw.tenant_id),
    courseId: String(raw.courseId ?? raw.course_id),
    tenantUserId: String(raw.tenantUserId ?? raw.tenant_user_id),
    status: raw.status ?? "active",
    progress: raw.progress ?? 0,
    completed: raw.completed ?? false,
    completedLessonsCount: raw.completedLessonsCount ?? raw.completed_lessons_count ?? 0,
    totalLessonsCount: raw.totalLessonsCount ?? raw.total_lessons_count ?? 0,
    lastActivityAt: raw.lastActivityAt ?? raw.last_activity_at ?? null,
    completedAt: raw.completedAt ?? raw.completed_at ?? null,
    student: raw.student
      ? {
          id: String(raw.student.id),
          name: raw.student.name,
          email: raw.student.email,
          avatar: raw.student.avatar ?? null,
        }
      : raw.user
        ? {
            id: String(raw.user.id),
            name: raw.user.name,
            email: raw.user.email,
            avatar: raw.user.avatar ?? null,
          }
        : { id: "", name: "غير معروف", email: "", avatar: null },
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

function buildListParams(params?: EnrollmentFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.course_id) q.course_id = params.course_id;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const enrollmentsService = {
  async list(params?: EnrollmentFilterParams): Promise<{ data: Enrollment[]; total: number; currentPage: number; lastPage: number }> {
    const { data } = await api.get("/enrollments", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatEnrollment),
      total: data.total ?? 0,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1,
    };
  },

  async getById(id: string): Promise<Enrollment | null> {
    const { data } = await api.get(`/enrollments/${id}`);
    return data.enrollment ? formatEnrollment(data.enrollment) : null;
  },

  async create(courseId: string, tenantUserId: string): Promise<Enrollment> {
    const { data } = await api.post(`/courses/${courseId}/enrollments`, {
      tenant_user_id: Number(tenantUserId),
      status: "active",
    });
    return formatEnrollment(data.enrollment);
  },
};
