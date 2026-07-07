"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformTenantsApiService as api } from "../services/platformTenantsApiService";
import { TENANTS_QUERY_KEY } from "../constants";
import type { TenantsFilterParams, Tenant, WizardState } from "../types";
import { tenantsService } from "../services/tenantsService";

export function useTenants(params?: TenantsFilterParams) {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, "list", params],
    queryFn: () => api.list(params),
    select: (data) => data,
  });
}

export function useTenant(id: string | null) {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, "detail", id],
    queryFn: () => api.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useTenantsMetrics() {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, "metrics"],
    queryFn: () => api.getMetrics(),
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tenant>) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useCreateTenantWizard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wizard: WizardState) => api.createWizard(wizard),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      api.update(id, data),
    onSuccess: (savedTenant, { id }) => {
      if (savedTenant) {
        qc.setQueryData([TENANTS_QUERY_KEY, "detail", id], savedTenant);
      }
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsService.suspend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useArchiveTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteTenants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useDuplicateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useGenerateImpersonationToken() {
  return useMutation({
    mutationFn: (tenantId: string) => tenantsService.generateImpersonationToken(tenantId),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (tenantId: string) => tenantsService.resetPassword(tenantId),
  });
}

export function useSendWelcomeEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => tenantsService.sendWelcomeEmail(tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}

export function useResetTenantData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tenantsService.resetData(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] });
    },
  });
}
