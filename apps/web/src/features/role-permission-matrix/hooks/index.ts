"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolePermissionMatrixService } from "../services";
import { ROLE_PERMISSION_MATRIX_QUERY_KEY } from "../constants";
import type { CloneMode } from "../types";

export function useMatrix() {
  return useQuery({
    queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY, "matrix"],
    queryFn: () => rolePermissionMatrixService.getMatrix(),
  });
}

export function useRoleMatrix(roleId: string | null) {
  return useQuery({
    queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY, "role-matrix", roleId],
    queryFn: () => rolePermissionMatrixService.getMatrixForRole(roleId!),
    enabled: !!roleId,
  });
}

export function useMatrixRoles() {
  return useQuery({
    queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY, "roles"],
    queryFn: () => rolePermissionMatrixService.getRoles(),
  });
}

export function useMatrixPermissions() {
  return useQuery({
    queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY, "permissions"],
    queryFn: () => rolePermissionMatrixService.getPermissions(),
  });
}

export function useMatrixMetrics() {
  return useQuery({
    queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY, "metrics"],
    queryFn: () => rolePermissionMatrixService.getMetrics(),
  });
}

export function useSaveMatrix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matrix: Record<string, Record<string, boolean>>) =>
      rolePermissionMatrixService.saveMatrix(matrix),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY] });
    },
  });
}

export function useSaveRoleMatrix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: Record<string, boolean> }) =>
      rolePermissionMatrixService.saveRoleMatrix(roleId, permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY] });
    },
  });
}

export function useClonePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceRoleId, destinationRoleId, mode }: { sourceRoleId: string; destinationRoleId: string; mode: CloneMode }) =>
      rolePermissionMatrixService.clonePermissions(sourceRoleId, destinationRoleId, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROLE_PERMISSION_MATRIX_QUERY_KEY] });
    },
  });
}

export function useCopyPermissions() {
  return useMutation({
    mutationFn: (roleId: string) => rolePermissionMatrixService.copyPermissionsToClipboard(roleId),
  });
}
