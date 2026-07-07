"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantUsersService } from "../services";
import { TENANT_USERS_QUERY_KEY } from "../constants";
import type { TenantUserFilterParams, CreateTenantUserPayload, UpdateTenantUserPayload, TenantUser } from "../types";

export function useTenantUsers(params?: TenantUserFilterParams) {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "list", params],
    queryFn: () => tenantUsersService.list(params),
  });
}

export function useTenantUser(id: string | null) {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "detail", id],
    queryFn: () => tenantUsersService.getById(id!),
    enabled: !!id,
  });
}

export function useTenantUsersMetrics() {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "metrics"],
    queryFn: () => tenantUsersService.getMetrics(),
  });
}

export function useTenantUserActivities(userId: string | null) {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "activities", userId],
    queryFn: () => tenantUsersService.getActivities(userId!),
    enabled: !!userId,
  });
}

export function useTenantUserDevices(userId: string | null) {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "devices", userId],
    queryFn: () => tenantUsersService.getDevices(userId!),
    enabled: !!userId,
  });
}

export function useTenantUserSessions(userId: string | null) {
  return useQuery({
    queryKey: [TENANT_USERS_QUERY_KEY, "sessions", userId],
    queryFn: () => tenantUsersService.getSessions(userId!),
    enabled: !!userId,
  });
}

export function useCreateTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantUserPayload) => tenantUsersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantUserPayload }) =>
      tenantUsersService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useDeleteTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteTenantUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantUsersService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useSuspendTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.suspend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useActivateTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useBulkSuspendTenantUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantUsersService.bulkSuspend(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useBulkActivateTenantUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantUsersService.bulkActivate(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useForceLogoutTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.forceLogout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY, "sessions"] });
    },
  });
}

export function useResetTenantUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.resetPassword(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY, "detail"] });
    },
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.sendInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.resendInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) =>
      tenantUsersService.revokeSession(userId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY, "sessions"] });
    },
  });
}

export function useToggleTrustedDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, deviceId, trusted }: { userId: string; deviceId: string; trusted: boolean }) =>
      tenantUsersService.toggleTrustedDevice(userId, deviceId, trusted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY, "devices"] });
    },
  });
}

export function useRestoreTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantUsersService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useBulkRestoreTenantUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tenantUsersService.bulkRestore(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANT_USERS_QUERY_KEY] });
    },
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: () => tenantUsersService.exportCsv(),
  });
}
