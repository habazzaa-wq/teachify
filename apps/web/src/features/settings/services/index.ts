import api from "@/services/api/axios";
import type { SiteSettings, TenantSettings } from "../types";

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

  async getSite() {
    const { data } = await api.get("/settings/site");
    return data.values as SiteSettings;
  },

  async updateSite(values: Partial<SiteSettings>) {
    const { data } = await api.put("/settings/site", { values });
    return data.values as SiteSettings;
  },

  async getPlatform(): Promise<SiteSettings> {
    const { data } = await api.get("/settings/platform");
    return data.branding as SiteSettings;
  },

  async updatePlatform(values: Partial<SiteSettings>) {
    const { data } = await api.put("/settings/platform", values);
    return data.branding as SiteSettings;
  },
};
