import api from "@/services/api/axios";
import { normalizeHeroSettings, type HeroSettings } from "./types";

export const heroService = {
  async getPublicHero() {
    const { data } = await api.get<{ hero: HeroSettings }>("/public/hero");
    return data.hero;
  },

  async getHeroSettings() {
    // Edit the copy visitors actually see. The raw settings row can contain
    // nulls while /public/hero applies the tenant-aware fallbacks, so reading
    // it here is what made the default title/subtitle look uneditable.
    const { data } = await api.get<{ hero: HeroSettings }>("/public/hero");
    return normalizeHeroSettings(data.hero);
  },

  async updateHeroSettings(hero: HeroSettings) {
    const { data } = await api.put("/settings/homepage", { values: { hero } });
    return data;
  },
};
