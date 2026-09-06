import { api } from "@/services/api";
import type {
  Student,
  StudentDetail,
  StudentMetrics,
  StudentEnrollment,
  StudentAnalytics,
  StudentFilterParams,
  CreateStudentPayload,
  InviteStudentPayload,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStudent(raw: Record<string, any>): Student {
  return {
    id: String(raw.id),
    tenantUserId: String(raw.tenantUserId ?? raw.tenant_user_id ?? raw.id),
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? "غير معروف",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    parentPhone: raw.parentPhone ?? raw.parent_phone ?? "",
    gender: raw.gender ?? "",
    nationality: raw.nationality ?? "",
    studyLevel: raw.studyLevel ?? raw.study_level ?? "",
    governorate: raw.governorate ?? "",
    city: raw.city ?? "",
    avatar: raw.avatar ?? null,
    status: raw.status ?? "active",
    enrolledCoursesCount: raw.enrolledCoursesCount ?? raw.enrolled_courses_count ?? 0,
    completedCoursesCount: raw.completedCoursesCount ?? raw.completed_courses_count ?? 0,
    joinedAt: raw.joinedAt ?? raw.joined_at ?? null,
    lastActivityAt: raw.lastActivityAt ?? raw.last_activity_at ?? null,
    lastLoginAt: raw.lastLoginAt ?? raw.last_login_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStudentDetail(raw: Record<string, any>): StudentDetail {
  const base = formatStudent(raw);
  return {
    ...base,
    averageProgress: raw.averageProgress ?? raw.average_progress ?? 0,
    averageQuizScore: raw.averageQuizScore ?? raw.average_quiz_score ?? 0,
    averageAssignmentScore: raw.averageAssignmentScore ?? raw.average_assignment_score ?? 0,
    role: raw.role ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatEnrollment(raw: Record<string, any>): StudentEnrollment {
  return {
    id: String(raw.id),
    courseId: String(raw.courseId ?? raw.course_id),
    courseTitle: raw.courseTitle ?? raw.course_title ?? raw.course?.title ?? "غير محدد",
    courseThumbnail: raw.courseThumbnail ?? raw.course_thumbnail ?? raw.course?.thumbnail_url ?? null,
    courseSlug: raw.courseSlug ?? raw.course_slug ?? raw.course?.slug ?? null,
    status: raw.status ?? "active",
    enrolledAt: raw.enrolledAt ?? raw.enrolled_at ?? new Date().toISOString(),
    startedAt: raw.startedAt ?? raw.started_at ?? null,
    completedAt: raw.completedAt ?? raw.completed_at ?? null,
    cancelledAt: raw.cancelledAt ?? raw.cancelled_at ?? null,
    completionPercent: raw.completionPercent ?? raw.completion_percent ?? 0,
    progressRecordsCount: raw.progressRecordsCount ?? raw.progress_records_count ?? 0,
    completedLessonsCount: raw.completedLessonsCount ?? raw.completed_lessons_count ?? 0,
    totalLessonsCount: raw.totalLessonsCount ?? raw.total_lessons_count ?? 0,
  };
}

function buildListParams(params?: StudentFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const studentsService = {
  async list(params?: StudentFilterParams): Promise<{
    data: Student[];
    total: number;
    currentPage: number;
    lastPage: number;
  }> {
    const { data } = await api.get("/students", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatStudent),
      total: data.total ?? 0,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1,
    };
  },

  async getMetrics(): Promise<StudentMetrics> {
    const { data } = await api.get("/students/metrics");
    const m = data.data ?? data;
    return {
      totalStudents: m.totalStudents ?? m.total_students ?? 0,
      activeStudents: m.activeStudents ?? m.active_students ?? 0,
      enrolledStudents: m.enrolledStudents ?? m.enrolled_students ?? 0,
      newThisMonth: m.newThisMonth ?? m.new_this_month ?? 0,
      averageProgress: m.averageProgress ?? m.average_progress ?? 0,
      completionRate: m.completionRate ?? m.completion_rate ?? 0,
    };
  },

  async getById(id: string): Promise<StudentDetail | null> {
    const { data } = await api.get(`/students/${id}`);
    return data.data ? formatStudentDetail(data.data) : null;
  },

  async getEnrollments(id: string): Promise<StudentEnrollment[]> {
    const { data } = await api.get(`/students/${id}/enrollments`);
    return (data.data ?? []).map(formatEnrollment);
  },

  async getAnalytics(id: string): Promise<StudentAnalytics> {
    const { data } = await api.get(`/students/${id}/analytics`);
    const a = data.data ?? data;
    return {
      totalEnrolledCourses: a.totalEnrolledCourses ?? a.total_enrolled_courses ?? 0,
      completedCourses: a.completedCourses ?? a.completed_courses ?? 0,
      averageProgress: a.averageProgress ?? a.average_progress ?? 0,
      averageQuizScore: a.averageQuizScore ?? a.average_quiz_score ?? 0,
      totalQuizAttempts: a.totalQuizAttempts ?? a.total_quiz_attempts ?? 0,
      averageAssignmentScore: a.averageAssignmentScore ?? a.average_assignment_score ?? 0,
      totalAssignmentSubmissions: a.totalAssignmentSubmissions ?? a.total_assignment_submissions ?? 0,
      certificatesEarned: a.certificatesEarned ?? a.certificates_earned ?? 0,
      lastActivityAt: a.lastActivityAt ?? a.last_activity_at ?? null,
    };
  },

  async create(payload: CreateStudentPayload): Promise<Student> {
    const { data } = await api.post("/students", {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || undefined,
      parent_phone: payload.parent_phone || undefined,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      gender: payload.gender || undefined,
      nationality: payload.nationality || undefined,
      study_level: payload.study_level || undefined,
      governorate: payload.governorate || undefined,
      city: payload.city || undefined,
    });
    return formatStudent(data.data);
  },

  async invite(payload: InviteStudentPayload): Promise<{ id: string; email: string; status: string; expires_at: string }> {
    const { data } = await api.post("/students/invite", {
      email: payload.email,
    });
    return data.invitation;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await api.post("/students/bulk-destroy", { ids: ids.map(Number) });
  },
};
