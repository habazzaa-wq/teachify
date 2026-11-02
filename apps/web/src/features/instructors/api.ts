import axios from "axios";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";
import { useInstructorAuthStore } from "./store";
import type {
  InstructorCoursesResponse,
  InstructorCourseResponse,
  InstructorMembership,
  InstructorSessionResponse,
  InstructorCourseUpdatePayload,
  InstructorUser,
} from "./types";

interface InstructorRequestOptions {
  token?: string | null;
  data?: unknown;
  multipart?: boolean;
  responseType?: "blob";
  params?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  signal?: AbortSignal;
  timeout?: number;
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options: InstructorRequestOptions = {},
): Promise<T> {
  const tenant = useTenantStore.getState();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (!options.multipart) headers["Content-Type"] = "application/json";

  if (tenant.activeTenant?.id) {
    headers["X-Tenant-ID"] = String(tenant.activeTenant.id);
  } else if (tenant.domain) {
    headers["X-Tenant-Domain"] = tenant.domain;
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await axios.request<T>({
    baseURL: resolveApiBaseUrl(),
    url: `/${path.replace(/^\/+/, "")}`,
    method,
    data: options.data,
    params: options.params,
    signal: options.signal,
    headers,
    responseType: options.responseType,
    withCredentials: true,
    timeout: options.timeout ?? 15_000,
  });

  return response.data;
}

export const instructorApi = {
  login(email: string, password: string) {
    return request<InstructorSessionResponse>("instructor/auth/login", "POST", {
      data: { email, password },
    });
  },

  refresh(refreshToken: string) {
    return request<{ access_token: string }>("instructor/auth/refresh", "POST", {
      data: { refresh_token: refreshToken },
    });
  },

  me(token: string) {
    return request<{
      user: InstructorUser;
      membership: InstructorMembership;
    }>("instructor/auth/me", "GET", { token });
  },

  updateProfile(token: string, data: {
    first_name: string;
    last_name: string;
    avatar: string | null;
    job_title: string;
    department: string;
    phone: string;
    bio: string;
    expertise: string;
    experience_years: number | null;
    website_url: string | null;
    linkedin_url: string | null;
    youtube_url: string | null;
  }) {
    return request<{
      user: InstructorUser;
      membership: InstructorMembership;
    }>("instructor/auth/profile", "PUT", { token, data });
  },

  uploadMediaFile(token: string, file: File) {
    const data = new FormData();
    data.append("file", file);
    return request<{
      data: { asset: { cdnUrl: string | null; thumbnailUrl: string | null } };
    }>("instructor/media-library/upload/file", "POST", { token, data, multipart: true });
  },

  mediaLibraryRequest<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    options: Pick<InstructorRequestOptions, "data" | "params" | "signal" | "timeout"> = {},
  ) {
    const token = useInstructorAuthStore.getState().accessToken;
    return request<T>(`instructor/media-library/${path.replace(/^\/+/, "")}`, method, {
      ...options,
      token,
    });
  },

  examBankRequest<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    options: Pick<InstructorRequestOptions, "data" | "params" | "multipart" | "responseType" | "timeout"> = {},
  ) {
    const token = useInstructorAuthStore.getState().accessToken;
    return request<T>(`instructor/${path.replace(/^\/+/, "")}`, method, {
      ...options,
      token,
    });
  },

  fetchAnswerPage(url: string) {
    const apiBase = new URL(resolveApiBaseUrl());
    const pageUrl = new URL(url, apiBase);

    if (
      pageUrl.origin !== apiBase.origin ||
      !pageUrl.pathname.startsWith(`${apiBase.pathname}/instructor/exam-bank/exam-attempts/`)
    ) {
      throw new Error("Invalid instructor answer-page URL.");
    }

    const path = pageUrl.pathname.slice(apiBase.pathname.length).replace(/^\/instructor\//, "");
    return this.examBankRequest<Blob>(path, "GET", {
      responseType: "blob",
      timeout: 60_000,
    });
  },

  changePassword(token: string, password: string, passwordConfirmation: string) {
    return request<{
      access_token: string;
      refresh_token: string;
      must_change_password: false;
    }>("instructor/auth/change-password", "POST", {
      token,
      data: { password, password_confirmation: passwordConfirmation },
    });
  },

  logout(token: string) {
    return request<{ message: string }>("instructor/auth/logout", "POST", { token });
  },

  listCourses(token: string) {
    return request<InstructorCoursesResponse>("instructor/courses", "GET", { token });
  },

  workspace(token: string) {
    return request<{ data: InstructorWorkspaceMetrics }>("instructor/workspace", "GET", { token });
  },

  listStudents(token: string) {
    return request<InstructorListResponse<InstructorStudent>>("instructor/students", "GET", { token });
  },

  listStudentsAdminView(
    token: string,
    params: { search?: string; status?: string; sort?: string; sort_dir?: string; page?: number; per_page?: number },
  ) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== "all") query.set(key, String(value));
    });
    const queryString = query.toString();
    return request<InstructorStudentAdminListResponse>(
      `instructor/students${queryString ? `?${queryString}` : ""}`,
      "GET",
      { token },
    );
  },

  studentMetrics(token: string) {
    return request<{ data: InstructorStudentMetrics }>("instructor/students/metrics", "GET", { token });
  },

  listExams(token: string) {
    return request<InstructorListResponse<InstructorExam>>("instructor/exams", "GET", { token });
  },

  gradingQueue(token: string) {
    return request<InstructorListResponse<InstructorSubmission>>("instructor/grading/queue", "GET", { token });
  },

  examGradingQueue(token: string) {
    return request<InstructorListResponse<InstructorExamAnswer>>(
      "instructor/grading/exam-answers",
      "GET",
      { token },
    );
  },

  gradeExamAnswer(token: string, attemptId: string, answerId: string, manualScore: number, feedback: string) {
    return request<{ data: { answer: { gradingStatus: string }; attempt: { score: number } } }>(
      `instructor/grading/exam-attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(answerId)}`,
      "PUT",
      { token, data: { manual_score: manualScore, feedback } },
    );
  },

  listExamAnswerPages(token: string, attemptId: string, examQuestionId: string) {
    return request<{
      data: { pages: { id: string; pageOrder: number; mimeType: string | null }[] };
    }>(
      `exam-attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(examQuestionId)}/pages`,
      "GET",
      { token },
    );
  },

  fetchExamAnswerPage(token: string, attemptId: string, examQuestionId: string, pageId: string) {
    return request<Blob>(
      `exam-attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(examQuestionId)}/pages/${encodeURIComponent(pageId)}`,
      "GET",
      { token, responseType: "blob" },
    );
  },

  listMediaAssets(token: string) {
    return request<{ data: InstructorMediaAsset[]; meta: InstructorPagination }>(
      "instructor/media-library/assets",
      "GET",
      { token },
    );
  },

  gradeAssignment(token: string, assignmentId: string, submissionId: string, score: number, feedback: string) {
    return request<{ message: string }>(
      `instructor/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/grade`,
      "PUT",
      { token, data: { score, feedback } },
    );
  },

  createCourse(token: string, data: { title: string; slug?: string }) {
    return request<InstructorCourseResponse>("instructor/courses", "POST", { token, data });
  },

  getCourse(token: string, courseId: string) {
    return request<InstructorCourseResponse>(
      `instructor/courses/${encodeURIComponent(courseId)}`,
      "GET",
      { token },
    );
  },

  updateCourse(token: string, courseId: string, data: InstructorCourseUpdatePayload) {
    return request<InstructorCourseResponse>(
      `instructor/courses/${encodeURIComponent(courseId)}`,
      "PUT",
      { token, data },
    );
  },

  publishCourse(token: string, courseId: string) {
    return request<InstructorCourseResponse>(
      `instructor/courses/${encodeURIComponent(courseId)}/publish`,
      "PATCH",
      { token },
    );
  },
};

export interface InstructorWorkspaceMetrics {
  courses: number;
  students: number;
  media: number;
  exams: number;
  quizzes: number;
  pending_grading: number;
}

export interface InstructorPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InstructorListResponse<T> {
  data: T[];
  meta: InstructorPagination;
}

export interface InstructorStudent {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  courses_count: number;
  joined_at: string | null;
}

export interface InstructorStudentAdminView {
  id: string;
  tenantUserId: string;
  fullName: string;
  email: string;
  phone: string;
  parentPhone: string;
  gender: string;
  nationality: string;
  studyLevel: string;
  governorate: string;
  city: string;
  avatar: string | null;
  status: "active" | "inactive" | "suspended";
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  joinedAt: string | null;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InstructorStudentMetrics {
  totalStudents: number;
  activeStudents: number;
  enrolledStudents: number;
  newThisMonth: number;
  averageProgress: number;
  completionRate: number;
}

export interface InstructorStudentAdminListResponse {
  data: InstructorStudentAdminView[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface InstructorExam {
  id: string;
  title: string;
  status: string;
  question_count: number;
  attempts_count: number;
  created_at: string | null;
}

export interface InstructorSubmission {
  id: string;
  status: string;
  notes: string | null;
  submitted_at: string | null;
  student: { id: string; name: string | null; email: string | null };
  assignment: { id: string; title: string; max_score: number; course: string | null };
  files: { title: string | null; url: string | null; mime_type: string | null }[];
}

export interface InstructorExamAnswer {
  id: string;
  attempt_id: string;
  exam_question_id: string;
  exam: { id: string; title: string };
  student: { id: string; name: string | null };
  question: { title: string | null; type: string | null; points: number };
  answer: unknown;
  answer_mode: string | null;
  grading_status: string;
  manual_score: number | null;
  feedback: string | null;
  page_count: number;
  submitted_at: string | null;
}

export interface InstructorMediaAsset {
  id: number;
  type: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  originalFilename: string;
  title: string | null;
  sizeBytes: number;
  createdById: number | null;
  uploaderId: number | null;
}

export function instructorApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    return data?.message ?? Object.values(data?.errors ?? {}).flat()[0] ?? "تعذر تنفيذ الطلب.";
  }
  return error instanceof Error ? error.message : "تعذر تنفيذ الطلب.";
}
