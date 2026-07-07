import api from "@/services/api/axios";
import type { Role, CreateRolePayload } from "../types";

export const rolesService = {
  async list(params?: { search?: string; page?: number; per_page?: number }) {
    const { data } = await api.get("/roles", { params });
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get(`/roles/${id}`);
    return data.role as Role;
  },

  async create(payload: CreateRolePayload) {
    const { data } = await api.post("/roles", payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateRolePayload>) {
    const { data } = await api.put(`/roles/${id}`, payload);
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/roles/${id}`);
    return data;
  },

  async getPermissions() {
    const { data } = await api.get("/permissions");
    return data.permissions as Array<{ id: number; name: string; slug: string; description: string | null }>;
  },
};
