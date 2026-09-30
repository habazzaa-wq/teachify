import api from "@/services/api/axios";
import type { FooterSettings } from "./types";

export const footerService = {
  async getPublicFooter() {
    const { data } = await api.get<{ footer: unknown }>("/public/footer");
    return data.footer;
  },

  async getFooterSettings() {
    const { data } = await api.get<{ values: unknown }>("/settings/footer");
    return data.values;
  },

  async updateFooterSettings(settings: FooterSettings) {
    const { data } = await api.put("/settings/footer", { values: settings });
    return data;
  },
};