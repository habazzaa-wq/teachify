import api from "@/services/api/axios";
import type { TeacherDashboardData } from "../types";

export const dashboardService = {
  async getStats(): Promise<TeacherDashboardData> {
    const { data } = await api.get<TeacherDashboardData>("/dashboard/stats");
    return data;
  },
};