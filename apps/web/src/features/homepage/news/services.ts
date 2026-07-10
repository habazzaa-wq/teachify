import api from "@/services/api/axios";
import type {
  NewsInput,
  NewsRecord,
  PublicNewsResponse,
  TickerConfig,
} from "./types";

export const newsService = {
  /** Public, unauthenticated: active news + ticker settings for the current tenant. */
  async getPublicNews() {
    const { data } = await api.get<PublicNewsResponse>("/public/news");
    return data;
  },

  /** Authenticated: paginated list of all news (active + inactive). */
  async list(params?: { inactive?: boolean; per_page?: number }) {
    const { data } = await api.get("/teacher/news", { params });
    return data as {
      data: NewsRecord[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  },

  async get(id: number) {
    const { data } = await api.get<{ data: NewsRecord }>(`/teacher/news/${id}`);
    return data.data;
  },

  async create(payload: NewsInput) {
    const { data } = await api.post<{ data: NewsRecord }>("/teacher/news", payload);
    return data.data;
  },

  async update(id: number, payload: Partial<NewsInput>) {
    const { data } = await api.put<{ data: NewsRecord }>(
      `/teacher/news/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: number) {
    await api.delete(`/teacher/news/${id}`);
  },

  async reorder(orders: { id: number; sort_order: number }[]) {
    const { data } = await api.post("/teacher/news/reorder", { orders });
    return data;
  },

  /** Ticker appearance settings are stored in the `homepage` settings group. */
  async getTickerSettings() {
    const { data } = await api.get<{ values: { ticker?: Partial<TickerConfig> } }>(
      "/settings/homepage",
    );
    return data.values.ticker ?? {};
  },

  async updateTickerSettings(ticker: TickerConfig) {
    const { data } = await api.put("/settings/homepage", { values: { ticker } });
    return data;
  },
};
