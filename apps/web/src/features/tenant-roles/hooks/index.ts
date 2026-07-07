"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantRolesService } from "../services";
import { TENANT_ROLES_QUERY_KEY } from "../constants";
import type { TenantRoleFilterParams, CreateTenantRolePayload, UpdateTenantRolePayload, TenantRole } from "../types";

export function useTenantRoles(params?: TenantRoleFilterParams) {
  return useQuery({
    queryKey: [TENANT_ROLES_QUERY_KEY, "list", params],
    queryFn: () => tenantRolesService.list(params),
  });
}

export function useTenantRole(id: string | null) {
  return useQuery({
    queryKey: [TENANT_ROLES_QUERY_KEY, "detail", id],
    queryFn: () => tenantRolesService.getById(id!),
    enabled: !!id,
  });
}

export function useTenantRolesMetrics() {
  return useQuery({
    queryKey: [TENANT_ROLES_QUERY_KEY, "metrics"],
    queryFn: () => tenantRolesService.getMetrics(),
  });
}

export function useRoleUsers(roleId: string | null) {
  return useQuery({
    queryKey: [TENANT_ROLES_QUERY_KEY, "users", roleId],
    queryFn: () => tenantRolesService.getUsers(roleId!),
    enabled: !!roleId,
  });
}

export function useRoleActivities(roleId: string | null) {
  return useQuery({
    queryKey: [TENANT_ROLES_QUERY_KEY, "activities", roleId],
    queryFn: () => tenantRolesService.getActivities(roleId!),
    enabled: !!roleId,
  });
}

export function useCreateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantRolePayload) => tenantRolesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useUpdateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRolePayload }) =>
      tenantRolesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useDeleteTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteTenantRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantRolesService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useDuplicateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useArchiveTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useRestoreTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useActivateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useDeactivateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantRolesService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useBulkArchiveTenantRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantRolesService.bulkArchive(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useBulkRestoreTenantRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantRolesService.bulkRestore(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}

export function useAssignUsersToRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userIds }: { roleId: string; userIds: string[] }) =>
      tenantRolesService.assignUsers(roleId, userIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
  });
}
