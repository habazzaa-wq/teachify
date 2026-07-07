import api from "./axios";
import type { DashboardStats } from "@/features/dashboard/types";

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>("/dashboard/stats");
    return data;
  },
};
