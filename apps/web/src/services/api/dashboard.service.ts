import api from "./axios";
import type { TeacherDashboardData } from "@/features/dashboard/types";

export const dashboardApi = {
  async getStats(): Promise<TeacherDashboardData> {
    const { data } = await api.get<TeacherDashboardData>("/dashboard/stats");
    return data;
  },
};
