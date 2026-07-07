"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantPermissionsService } from "../services";
import { TENANT_PERMISSIONS_QUERY_KEY } from "../constants";
import type { TenantPermissionFilterParams, CreateTenantPermissionPayload, UpdateTenantPermissionPayload } from "../types";

export function useTenantPermissions(params?: TenantPermissionFilterParams) {
  return useQuery({
    queryKey: [TENANT_PERMISSIONS_QUERY_KEY, "list", params],
    queryFn: () => tenantPermissionsService.list(params),
  });
}

export function useTenantPermission(id: string | null) {
  return useQuery({
    queryKey: [TENANT_PERMISSIONS_QUERY_KEY, "detail", id],
    queryFn: () => tenantPermissionsService.getById(id!),
    enabled: !!id,
  });
}

export function useTenantPermissionsMetrics() {
  return useQuery({
    queryKey: [TENANT_PERMISSIONS_QUERY_KEY, "metrics"],
    queryFn: () => tenantPermissionsService.getMetrics(),
  });
}

export function usePermissionRoles(permissionId: string | null) {
  return useQuery({
    queryKey: [TENANT_PERMISSIONS_QUERY_KEY, "roles", permissionId],
    queryFn: () => tenantPermissionsService.getRoles(permissionId!),
    enabled: !!permissionId,
  });
}

export function usePermissionActivities(permissionId: string | null) {
  return useQuery({
    queryKey: [TENANT_PERMISSIONS_QUERY_KEY, "activities", permissionId],
    queryFn: () => tenantPermissionsService.getActivities(permissionId!),
    enabled: !!permissionId,
  });
}

export function useCreateTenantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantPermissionPayload) => tenantPermissionsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useUpdateTenantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantPermissionPayload }) =>
      tenantPermissionsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useDeleteTenantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantPermissionsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteTenantPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantPermissionsService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useArchiveTenantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantPermissionsService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useRestoreTenantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantPermissionsService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useBulkArchiveTenantPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantPermissionsService.bulkArchive(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}

export function useBulkRestoreTenantPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantPermissionsService.bulkRestore(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_PERMISSIONS_QUERY_KEY] });
    },
  });
}
