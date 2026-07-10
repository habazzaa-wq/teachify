"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bunnySettingsService } from "../services";
import { BUNNY_SETTINGS_QUERY_KEY } from "../constants";
import { toSnakeCase } from "../utils";
import type { BunnySettings } from "../types";

export function useBunnySettings() {
  return useQuery({
    queryKey: [BUNNY_SETTINGS_QUERY_KEY, "settings"],
    queryFn: () => bunnySettingsService.get(),
    staleTime: 10_000,
  });
}

export function useUpdateBunnySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BunnySettings>) =>
      bunnySettingsService.update(toSnakeCase(payload as Record<string, unknown>)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}

export function useVerifyBunnyConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      bunnySettingsService.verify(toSnakeCase(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}

export function useBunnyHealth() {
  return useQuery({
    queryKey: [BUNNY_SETTINGS_QUERY_KEY, "health"],
    queryFn: () => bunnySettingsService.health(),
    enabled: false,
    retry: false,
  });
}

export function useRotateBunnySecrets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      bunnySettingsService.rotate(toSnakeCase(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}

export function useRevealBunnySecret() {
  return useMutation({
    mutationFn: (field: string) => bunnySettingsService.reveal(field),
  });
}

export function useDisableBunnyIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => bunnySettingsService.disable(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}

export function useResetBunnyConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => bunnySettingsService.reset(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}

export function useDeleteBunnyCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => bunnySettingsService.deleteCredentials(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [BUNNY_SETTINGS_QUERY_KEY] });
    },
  });
}
