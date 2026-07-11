import { api } from "@/services/api";
import type { TenantUser, TenantUserFilterParams, TenantUserMetricData, CreateTenantUserPayload, UpdateTenantUserPayload, TenantUserActivity, TenantUserSession } from "../types";

function formatUser(raw: any): TenantUser {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    avatar: raw.avatar ?? null,
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone ?? "",
    department: raw.department ?? "management",
    jobTitle: raw.jobTitle ?? "",
    role: raw.role ?? { id: "", name: "", slug: "custom" },
    status: raw.status ?? "active",
    twoFactorEnabled: raw.twoFactorEnabled ?? false,
    language: raw.language ?? "ar",
    timezone: raw.timezone ?? "UTC",
    lastLogin: raw.lastLogin ?? null,
    lastPasswordChange: raw.lastPasswordChange ?? null,
    recoveryEmail: raw.recoveryEmail ?? null,
    notes: raw.notes ?? "",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildListParams(params?: TenantUserFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.department && params.department !== "all") q.department = params.department;
  if (params.sort) q.sort = params.sort === "fullName" ? "name" : params.sort === "lastLogin" ? "last_login_at" : params.sort;
  if (params.sortDir) q.sort_dir = params.sortDir;
  if (params.page) q.page = String(params.page);
  if (params.perPage) q.per_page = String(params.perPage);
  return q;
}

export const tenantUsersService = {
  async list(params?: TenantUserFilterParams): Promise<{ data: TenantUser[]; total: number }> {
    const { data } = await api.get("/users", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatUser),
      total: data.total ?? 0,
    };
  },

  async getById(id: string): Promise<TenantUser | null> {
    const { data } = await api.get(`/users/${id}`);
    return data.data ? formatUser(data.data) : null;
  },

  async getMetrics(): Promise<TenantUserMetricData> {
    const { data } = await api.get("/users/metrics");
    return data.data;
  },

  async create(payload: CreateTenantUserPayload): Promise<TenantUser> {
    const { data } = await api.post("/users", {
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      department: payload.department,
      job_title: payload.jobTitle,
      status: payload.status,
      locale: payload.language,
      timezone: payload.timezone,
      avatar: payload.avatar,
      notes: payload.notes,
      role_ids: payload.roleSlug ? undefined : [],
    });
    return formatUser(data.data);
  },

  async update(id: string, payload: UpdateTenantUserPayload): Promise<TenantUser | null> {
    const body: Record<string, any> = {};
    if (payload.fullName !== undefined) body.name = payload.fullName;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.phone !== undefined) body.phone = payload.phone;
    if (payload.department !== undefined) body.department = payload.department;
    if (payload.jobTitle !== undefined) body.job_title = payload.jobTitle;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.language !== undefined) body.locale = payload.language;
    if (payload.timezone !== undefined) body.timezone = payload.timezone;
    if (payload.avatar !== undefined) body.avatar = payload.avatar;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.roleSlug !== undefined) body.role_ids = undefined;

    const { data } = await api.put(`/users/${id}`, body);
    return data.data ? formatUser(data.data) : null;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await api.post("/users/bulk/delete", { ids: ids.map(Number) });
  },

  async suspend(id: string): Promise<TenantUser | null> {
    const { data } = await api.post(`/users/${id}/suspend`);
    return data.data ? formatUser(data.data) : null;
  },

  async activate(id: string): Promise<TenantUser | null> {
    const { data } = await api.post(`/users/${id}/activate`);
    return data.data ? formatUser(data.data) : null;
  },

  async bulkSuspend(ids: string[]): Promise<void> {
    await api.post("/users/bulk/suspend", { ids: ids.map(Number) });
  },

  async bulkActivate(ids: string[]): Promise<void> {
    await api.post("/users/bulk/activate", { ids: ids.map(Number) });
  },

  async forceLogout(id: string): Promise<void> {
    await api.post(`/users/${id}/force-logout`);
  },

  async resetPassword(id: string): Promise<string> {
    const { data } = await api.post(`/users/${id}/reset-password`);
    return data.password;
  },

  async sendInvite(id: string): Promise<void> {
    // Invitations use a separate flow
  },

  async resendInvite(id: string): Promise<void> {
    // Invitations use a separate flow
  },

  async getActivities(userId: string): Promise<TenantUserActivity[]> {
    const { data } = await api.get(`/users/${userId}/activities`);
    return data.data ?? [];
  },

  async getDevices(_userId?: string | null): Promise<any[]> {
    return [];
  },

  async getSessions(userId: string): Promise<TenantUserSession[]> {
    const { data } = await api.get(`/users/${userId}/sessions`);
    return (data.data ?? []).map((s: any) => ({
      id: String(s.id),
      userId: String(s.userId),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      location: s.location ?? "",
      isCurrent: s.isCurrent ?? false,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
    }));
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await api.delete(`/users/${userId}/sessions/${sessionId}`);
  },

  async toggleTrustedDevice(_userId?: string, _deviceId?: string, _trusted?: boolean): Promise<void> {
    // Not implemented on backend
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get("/users/export", {
      responseType: "blob",
    });
    return response.data;
  },

  async restore(id: string): Promise<TenantUser | null> {
    const { data } = await api.post(`/users/${id}/restore`);
    return data.data ? formatUser(data.data) : null;
  },

  async bulkRestore(ids: string[]): Promise<void> {
    await api.post("/users/bulk/restore", { ids: ids.map(Number) });
  },
};
