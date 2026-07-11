import api from "@/services/api/axios";
import type { HeroSettings } from "./types";

export const heroService = {
  async getPublicHero() {
    const { data } = await api.get<{ hero: HeroSettings }>("/public/hero");
    return data.hero;
  },

  async getHeroSettings() {
    const { data } = await api.get<{ values: { hero?: Partial<HeroSettings> } }>(
      "/settings/homepage",
    );
    return data.values.hero ?? {};
  },

  async updateHeroSettings(hero: HeroSettings) {
    const { data } = await api.put("/settings/homepage", { values: { hero } });
    return data;
  },
};
