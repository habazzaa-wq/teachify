import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";

const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getStats(),
    staleTime: 30_000,
    retry: 2,
  });
}

export { dashboardKeys };
