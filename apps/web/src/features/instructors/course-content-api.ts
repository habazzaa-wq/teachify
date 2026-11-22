/* eslint-disable @typescript-eslint/no-explicit-any -- mirrors the loosely typed axios responses used by the existing course services */
import { api as tenantApi } from "@/services/api";
import { instructorApi } from "./api";
import { isInstructorWorkspace } from "./workspace";

type CourseContentRequestConfig = {
  params?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  responseType?: "blob";
  signal?: AbortSignal;
  timeout?: number;
};

type CourseContentMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  path: string,
  method: CourseContentMethod,
  data?: unknown,
  config: CourseContentRequestConfig = {},
): Promise<{ data: T }> {
  if (!isInstructorWorkspace()) {
    return tenantApi.request<T>({ url: path, method, data, ...config });
  }

  const response = await instructorApi.courseContentRequest<T>(
    path.replace(/^\/+/, ""),
    method,
    { data, ...config },
  );
  return { data: response };
}

/**
 * Course modules, sections and lessons live under `/instructor/courses/*` in the
 * instructor workspace, while the teacher dashboard keeps using `/courses/*`.
 * Services can keep their existing axios-style call sites by importing this
 * adapter instead of the tenant `api` client.
 */
export const courseContentApi = {
  get: <T = any>(path: string, config?: CourseContentRequestConfig) =>
    request<T>(path, "GET", undefined, config),
  post: <T = any>(path: string, data?: unknown, config?: CourseContentRequestConfig) =>
    request<T>(path, "POST", data, config),
  put: <T = any>(path: string, data?: unknown, config?: CourseContentRequestConfig) =>
    request<T>(path, "PUT", data, config),
  patch: <T = any>(path: string, data?: unknown, config?: CourseContentRequestConfig) =>
    request<T>(path, "PATCH", data, config),
  delete: <T = any>(path: string, config?: CourseContentRequestConfig) =>
    request<T>(path, "DELETE", undefined, config),
};
