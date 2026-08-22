import api from "@/services/api/axios";
import type { CommunitySectionSettings } from "./types";

export const communitySectionService = {
  async getPublicCommunitySection() {
    const { data } = await api.get<{
      community: Partial<CommunitySectionSettings> | null;
    }>("/public/community-section");
    return data.community;
  },

  async getCommunitySettings() {
    const { data } = await api.get<{
      values: { community?: Partial<CommunitySectionSettings> };
    }>("/settings/homepage");
    return data.values.community ?? null;
  },

  async updateCommunitySettings(community: CommunitySectionSettings) {
    const { data } = await api.put("/settings/homepage", {
      values: { community },
    });
    return data;
  },
};
