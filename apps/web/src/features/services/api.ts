import { resolveApiBaseUrl, resolveApiUrl } from "@/config/env";
import { api } from "@/services/api/axios";
import { getApiRequestContext } from "@/services/api/request-context";
import type { ServiceInstructor, ServicePayload, ServiceRecord } from "./types";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));
  if (!cookie) return null;
  const value = cookie.slice(prefix.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function uploadErrorMessage(payload: unknown, status: number): string {
  const body = payload as
    | { message?: string; errors?: Record<string, string | string[]> }
    | null
    | undefined;
  const fieldError = Object.values(body?.errors ?? {}).flat()[0];
  if (fieldError) return fieldError;
  if (body?.message) return body.message;
  return `تعذر رفع الصورة إلى خادم الموقع. (${status})`;
}

export const tenantServicesApi = {
  async list(): Promise<ServiceRecord[]> {
    const { data } = await api.get<{ services?: ServiceRecord[] }>("/services");
    return data.services ?? [];
  },

  async instructors(): Promise<ServiceInstructor[]> {
    const { data } = await api.get<{ instructors?: ServiceInstructor[] }>(
      "/services/instructors",
    );
    return data.instructors ?? [];
  },

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const { accessToken, tenantId, tenantDomain } = getApiRequestContext();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    else if (tenantDomain) headers["X-Tenant-Domain"] = tenantDomain;
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const xsrfToken = readCookie("XSRF-TOKEN");
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

    // Native fetch lets the browser add the multipart boundary. The shared
    // axios instance defaults to a JSON content type, which breaks file uploads.
    let response: Response;
    try {
      response = await fetch(`${resolveApiBaseUrl()}/services/upload-image`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
        signal: AbortSignal.timeout(300_000),
      });
    } catch (error) {
      throw new Error("تعذر رفع الصورة إلى خادم الموقع.", { cause: error });
    }

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // Keep the status-based fallback message when the body is not JSON.
      }
      throw new Error(uploadErrorMessage(payload, response.status));
    }

    const payload = (await response.json()) as { data?: { url?: string } };
    if (!payload?.data?.url) {
      throw new Error("تعذر رفع الصورة إلى خادم الموقع.");
    }
    return new URL(payload.data.url, resolveApiUrl()).toString();
  },

  async create(payload: ServicePayload): Promise<ServiceRecord> {
    const { data } = await api.post<{ service: ServiceRecord }>(
      "/services",
      payload,
    );
    return data.service;
  },

  async update(id: number, payload: ServicePayload): Promise<ServiceRecord> {
    const { data } = await api.put<{ service: ServiceRecord }>(
      `/services/${id}`,
      payload,
    );
    return data.service;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/services/${id}`);
  },
};
