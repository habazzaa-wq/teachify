"use client";

import { useQuery } from "@tanstack/react-query";
import { studentDashboardService } from "../services";

export const studentDashboardKeys = {
  all: ["student-dashboard"] as const,
  overview: () => [...studentDashboardKeys.all, "overview"] as const,
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: studentDashboardKeys.overview(),
    queryFn: () => studentDashboardService.getOverview(),
    staleTime: 60_000,
    retry: 1,
  });
}
