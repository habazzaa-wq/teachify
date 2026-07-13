import api from "@/services/api/axios";
import type { WhyChooseUsSettings } from "./types";

export const whyChooseUsService = {
  async getPublicWhyChooseUs() {
    const { data } = await api.get<{ whyChooseUs: WhyChooseUsSettings }>(
      "/public/why-choose-us",
    );
    return data.whyChooseUs;
  },

  async getWhyChooseUsSettings() {
    const { data } = await api.get<{ values: { whyChooseUs?: Partial<WhyChooseUsSettings> } }>(
      "/settings/homepage",
    );
    return data.values.whyChooseUs ?? {};
  },

  async updateWhyChooseUsSettings(whyChooseUs: WhyChooseUsSettings) {
    const { data } = await api.put("/settings/homepage", { values: { whyChooseUs } });
    return data;
  },
};
