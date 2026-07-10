"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bunnyCenterService } from "../services";
import { BUNNY_CENTER_QUERY_KEY } from "../constants";
import type { BunnyCenterFilters, ExportPayload } from "../types";

export function usePlatformMetrics() {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "platform-metrics"],
    queryFn: () => bunnyCenterService.getPlatformMetrics(),
    staleTime: 30_000,
  });
}

export function useServiceHealth() {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "service-health"],
    queryFn: () => bunnyCenterService.getServiceHealth(),
    staleTime: 15_000,
  });
}

export function useUsageReport(period: string = "yearly") {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "usage-report", period],
    queryFn: () => bunnyCenterService.getUsageReport(period),
    staleTime: 60_000,
  });
}

export function useTopConsumers() {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "top-consumers"],
    queryFn: () => bunnyCenterService.getTopConsumers(),
    staleTime: 60_000,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "alerts"],
    queryFn: () => bunnyCenterService.getAlerts(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSyncJobs() {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "sync-jobs"],
    queryFn: () => bunnyCenterService.getSyncJobs(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useTenantUsageList(filters?: BunnyCenterFilters) {
  return useQuery({
    queryKey: [BUNNY_CENTER_QUERY_KEY, "tenant-usage-list", filters],
    queryFn: () => bunnyCenterService.getTenantUsageList(filters),
    staleTime: 15_000,
  });
}

export function useExportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExportPayload) => bunnyCenterService.exportData(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_CENTER_QUERY_KEY] });
    },
  });
}
