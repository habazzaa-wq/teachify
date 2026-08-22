import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { StudentDashboardData } from "../types";

export const studentDashboardService = {
  async getOverview(): Promise<StudentDashboardData> {
    const json = await tenantStudentFetch<{ data: StudentDashboardData }>(
      "/student/dashboard",
    );
    return json.data;
  },
};
