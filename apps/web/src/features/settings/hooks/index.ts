"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../services";
import { SETTINGS_QUERY_KEY } from "../constants";
import type { SiteSettings } from "../types";

export function useSettings() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, "all"],
    queryFn: () => settingsService.getAll(),
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, "site"],
    queryFn: () => settingsService.getSite(),
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<SiteSettings>) => settingsService.updateSite(values),
    onSuccess: (result) => qc.setQueryData([SETTINGS_QUERY_KEY, "site"], result),
  });
}

export function useSettingsGroup(group: string) {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, "group", group],
    queryFn: () => settingsService.getGroup(group),
  });
}

export function useUpdateSettingsGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ group, values }: { group: string; values: Record<string, unknown> }) =>
      settingsService.updateGroup(group, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] }),
  });
}
