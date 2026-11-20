import api from "@/services/api/axios";
import type { AboutPageSettings } from "./types";

export const aboutPageService = {
  async getPublicAbout() {
    const { data } = await api.get<{ about: AboutPageSettings | null }>("/public/about");
    return data.about;
  },

  async getAboutSettings() {
    const { data } = await api.get<{ values: unknown }>("/settings/about");
    return data.values;
  },

  async updateAboutSettings(settings: AboutPageSettings) {
    const { data } = await api.put("/settings/about", { values: settings });
    return data;
  },
};
