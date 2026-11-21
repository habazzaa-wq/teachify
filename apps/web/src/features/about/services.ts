import api from "@/services/api/axios";
import type { AboutSettings } from "./types";

export const aboutService = {
  async getPublicAbout() {
    const { data } = await api.get<{ about: unknown }>("/public/about");
    return data.about;
  },

  async getAboutSettings() {
    const { data } = await api.get<{ values: unknown }>("/settings/about");
    return data.values;
  },

  async updateAboutSettings(settings: AboutSettings) {
    const { data } = await api.put("/settings/about", { values: settings });
    return data;
  },
};
