import api from "@/services/api/axios";
import type { SubjectInput, SubjectRecord } from "./types";

export const subjectsService = {
  async list(params?: { inactive?: boolean; per_page?: number }) {
    const { data } = await api.get("/teacher/subjects", { params });
    return data as {
      data: SubjectRecord[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  },

  async get(id: number) {
    const { data } = await api.get<{ data: SubjectRecord }>(
      `/teacher/subjects/${id}`,
    );
    return data.data;
  },

  async create(payload: SubjectInput) {
    const { data } = await api.post<{ data: SubjectRecord }>(
      "/teacher/subjects",
      payload,
    );
    return data.data;
  },

  async update(id: number, payload: Partial<SubjectInput>) {
    const { data } = await api.put<{ data: SubjectRecord }>(
      `/teacher/subjects/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: number) {
    await api.delete(`/teacher/subjects/${id}`);
  },

  async reorder(orders: { id: number; sort_order: number }[]) {
    const { data } = await api.post("/teacher/subjects/reorder", { orders });
    return data;
  },
};
