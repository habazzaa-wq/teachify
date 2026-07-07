import api from "@/services/api/axios";
import type { TenantIntegration, CreateIntegrationPayload } from "../types";

export const integrationsService = {
  async list() {
    const { data } = await api.get("/integrations");
    return data.integrations as TenantIntegration[];
  },

  async create(payload: CreateIntegrationPayload) {
    const { data } = await api.post("/integrations", payload);
    return data;
  },

  async update(id: number, payload: { config?: Record<string, unknown>; status?: string; external_id?: string }) {
    const { data } = await api.put(`/integrations/${id}`, payload);
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/integrations/${id}`);
    return data;
  },
};
