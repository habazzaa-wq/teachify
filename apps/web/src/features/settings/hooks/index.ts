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

export function useSettingsGroup(group: string) {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, "group", group],
    queryFn: () => settingsService.getGroup(group),
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
    mutationFn: (values: Partial<SiteSettings>) =>
      settingsService.updateSite(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] }),
  });
}

export function usePlatformBranding() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, "platform"],
    queryFn: () => settingsService.getPlatform(),
  });
}

export function useUpdatePlatformBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<SiteSettings>) =>
      settingsService.updatePlatform(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] }),
  });
}

export function useUpdateSettingsGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ group, values }: { group: string; values: Record<string, unknown> }) =>
      settingsService.updateGroup(group, values),
    onSuccess: (response, { group }) => {
      // Seed the cache with the values the server actually persisted *before*
      // invalidating. Otherwise the form falls back to the stale query data for
      // a moment after save (e.g. a disabled student field flips back to true
      // while the background refetch is still in flight).
      if (response?.values && typeof response.values === "object") {
        qc.setQueryData([SETTINGS_QUERY_KEY, "group", group], response.values);
      }
      return qc.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });
}
