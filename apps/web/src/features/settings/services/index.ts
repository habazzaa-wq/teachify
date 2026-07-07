import api from "@/services/api/axios";
import type { TenantSettings } from "../types";

export const settingsService = {
  async getAll() {
    const { data } = await api.get("/settings");
    return data.settings as TenantSettings;
  },

  async getGroup(group: string) {
    const { data } = await api.get(`/settings/${group}`);
    return data.values as Record<string, unknown>;
  },

  async updateGroup(group: string, values: Record<string, unknown>) {
    const { data } = await api.put(`/settings/${group}`, { values });
    return data;
  },
};
