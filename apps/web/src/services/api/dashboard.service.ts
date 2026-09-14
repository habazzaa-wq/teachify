import api from "./axios";
import type {
  DashboardQueryParams,
  TeacherDashboardData,
} from "@/features/dashboard/types";

export const dashboardApi = {
  async getStats(
    params: DashboardQueryParams = {},
  ): Promise<TeacherDashboardData> {
    const { data } = await api.get<TeacherDashboardData>("/dashboard/stats", {
      params,
    });
    return data;
  },
};