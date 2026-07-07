"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsService } from "../services";
import { INTEGRATIONS_QUERY_KEY } from "../constants";
import type { CreateIntegrationPayload } from "../types";

export function useIntegrations() {
  return useQuery({
    queryKey: [INTEGRATIONS_QUERY_KEY, "list"],
    queryFn: () => integrationsService.list(),
  });
}

export function useCreateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIntegrationPayload) => integrationsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_QUERY_KEY] }),
  });
}

export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { config?: Record<string, unknown>; status?: string } }) =>
      integrationsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_QUERY_KEY] }),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integrationsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_QUERY_KEY] }),
  });
}
