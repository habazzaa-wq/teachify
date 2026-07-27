import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveApiBaseUrl } from "@/config/env";
import type { StudentProfile } from "../types";

export const studentProfileService = {
  async getProfile(): Promise<StudentProfile> {
    const { data } = await api.get("/student/profile");
    return data.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const form = new FormData();
    form.append("avatar", file);

    const token =
      (() => {
        try {
          return useAuthStore.getState().accessToken;
        } catch {
          return null;
        }
      })() ?? undefined;

    const tenantId =
      (() => {
        try {
          return useTenantStore.getState().activeTenant?.id?.toString() ?? null;
        } catch {
          return null;
        }
      })() ?? undefined;

    const domain =
      (() => {
        try {
          return useTenantStore.getState().domain ?? null;
        } catch {
          return null;
        }
      })() ?? undefined;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    else if (domain) headers["X-Tenant-Domain"] = domain;

    const baseUrl = (() => {
      try {
        return resolveApiBaseUrl();
      } catch {
        return "/api";
      }
    })();

    const res = await fetch(`${baseUrl}/student/profile/avatar`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    });

    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore non-json bodies
      }
      throw new Error(message);
    }

    const json = await res.json();
    return json.data;
  },
};
