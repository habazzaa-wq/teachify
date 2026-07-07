"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansService } from "../services/plansService";
import { PLANS_QUERY_KEY } from "../constants";
import type { PlansFilterParams, PremiumPlan } from "../types";

export function usePlans(params?: PlansFilterParams) {
  return useQuery({
    queryKey: [PLANS_QUERY_KEY, "list", params],
    queryFn: () => plansService.list(params),
    select: (data) => data,
  });
}

export function usePlan(id: string | null) {
  return useQuery({
    queryKey: [PLANS_QUERY_KEY, "detail", id],
    queryFn: () => plansService.getById(id!),
    enabled: !!id,
  });
}

export function usePlansMetrics() {
  return useQuery({
    queryKey: [PLANS_QUERY_KEY, "metrics"],
    queryFn: () => plansService.getMetrics(),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PremiumPlan>) => plansService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PremiumPlan> }) =>
      plansService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useDuplicatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useArchivePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useDeactivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}

export function useBulkDeletePlans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => plansService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLANS_QUERY_KEY] });
    },
  });
}
