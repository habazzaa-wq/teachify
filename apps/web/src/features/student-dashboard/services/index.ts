import api from "@/services/api/axios";
import type { StudentDashboardData } from "../types";

interface RawDashboardPayload {
  data: StudentDashboardData;
}

export const studentDashboardService = {
  async getOverview(): Promise<StudentDashboardData> {
    const { data } = await api.get<RawDashboardPayload>("/student/dashboard");
    return data.data;
  },
};
