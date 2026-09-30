import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";
import type { DashboardQueryParams } from "../types";

const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params: DashboardQueryParams = {}) =>
    [...dashboardKeys.all, "stats", params] as const,
};

export function useDashboardStats(params: DashboardQueryParams = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => dashboardService.getStats(params),
    staleTime: 30_000,
    retry: 2,
    placeholderData: keepPreviousData,
  });
}

export { dashboardKeys };