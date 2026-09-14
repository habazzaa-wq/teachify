import api from "@/services/api/axios";
import type { LegalContent, LegalDocumentType } from "./types";

export const legalService = {
  async getPublicLegal() {
    const { data } = await api.get<{ legal: unknown }>("/public/legal");
    return data.legal;
  },

  async getLegalSettings() {
    const { data } = await api.get<{ values: unknown }>("/settings/legal");
    return data.values;
  },

  async updateLegalContent(type: LegalDocumentType, content: LegalContent) {
    const { data } = await api.put("/settings/legal", { values: { [type]: content } });
    return data;
  },
};