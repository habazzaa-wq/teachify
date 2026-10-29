import axios from "axios";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";
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
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  options: InstructorRequestOptions = {},
): Promise<T> {
  const tenant = useTenantStore.getState();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

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
    url: `/api/v1/${path.replace(/^\/+/, "")}`,
    method,
    data: options.data,
    headers,
    withCredentials: true,
    timeout: 15_000,
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

export function instructorApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    return data?.message ?? Object.values(data?.errors ?? {}).flat()[0] ?? "تعذر تنفيذ الطلب.";
  }
  return error instanceof Error ? error.message : "تعذر تنفيذ الطلب.";
}
