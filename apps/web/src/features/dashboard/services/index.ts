import api from "@/services/api/axios";
import type { DashboardQueryParams, TeacherDashboardData } from "../types";

export const dashboardService = {
  async getStats(
    params: DashboardQueryParams = {},
  ): Promise<TeacherDashboardData> {
    const { data } = await api.get<TeacherDashboardData>("/dashboard/stats", {
      params,
    });
    return data;
  },
};