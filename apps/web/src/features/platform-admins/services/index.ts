import platformApi from "@/services/api/platform-axios";
import type { PlatformAdmin, CreatePlatformAdminPayload } from "../types";

export const platformAdminsService = {
  async list(params?: { search?: string; page?: number; per_page?: number }) {
    const { data } = await platformApi.get("/admins", { params });
    return data;
  },

  async getById(id: number) {
    const { data } = await platformApi.get(`/admins/${id}`);
    return data.admin as PlatformAdmin;
  },

  async create(payload: CreatePlatformAdminPayload) {
    const { data } = await platformApi.post("/admins", payload);
    return data;
  },

  async update(id: number, payload: { role?: string; status?: string }) {
    const { data } = await platformApi.put(`/admins/${id}`, payload);
    return data;
  },

  async delete(id: number) {
    const { data } = await platformApi.delete(`/admins/${id}`);
    return data;
  },

  async bulkDelete(ids: number[]) {
    const { data } = await platformApi.post("/admins/bulk-delete", { ids });
    return data;
  },
};
