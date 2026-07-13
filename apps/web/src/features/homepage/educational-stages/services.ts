import api from "@/services/api/axios";
import type {
  EducationalStageInput,
  EducationalStageRecord,
  PublicStagesResponse,
} from "./types";

export const educationalStagesService = {
  /** Public, unauthenticated: active educational stages for the current tenant. */
  async getPublicStages() {
    const { data } = await api.get<PublicStagesResponse>("/public/educational-stages");
    return data;
  },

  /** Authenticated: paginated list of all stages (active + inactive). */
  async list(params?: { inactive?: boolean; per_page?: number }) {
    const { data } = await api.get("/teacher/educational-stages", { params });
    return data as {
      data: EducationalStageRecord[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  },

  async get(id: number) {
    const { data } = await api.get<{ data: EducationalStageRecord }>(
      `/teacher/educational-stages/${id}`,
    );
    return data.data;
  },

  async create(payload: EducationalStageInput) {
    const { data } = await api.post<{ data: EducationalStageRecord }>(
      "/teacher/educational-stages",
      payload,
    );
    return data.data;
  },

  async update(id: number, payload: Partial<EducationalStageInput>) {
    const { data } = await api.put<{ data: EducationalStageRecord }>(
      `/teacher/educational-stages/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: number) {
    await api.delete(`/teacher/educational-stages/${id}`);
  },

  async reorder(orders: { id: number; sort_order: number }[]) {
    const { data } = await api.post("/teacher/educational-stages/reorder", { orders });
    return data;
  },
};
