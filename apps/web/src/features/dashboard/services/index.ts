import api from "@/services/api/axios";
import type { DashboardStats } from "../types";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>("/dashboard/stats");
    return data;
  },
};
