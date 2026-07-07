"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesService } from "../services";
import { ROLES_QUERY_KEY } from "../constants";
import type { CreateRolePayload } from "../types";

export function useRoles(params?: { search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, "list", params],
    queryFn: () => rolesService.list(params),
  });
}

export function useRole(id: number | null) {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, "detail", id],
    queryFn: () => rolesService.getById(id!),
    enabled: !!id,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, "permissions"],
    queryFn: () => rolesService.getPermissions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRolePayload> }) =>
      rolesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rolesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] }),
  });
}
