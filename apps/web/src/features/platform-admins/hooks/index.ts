"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformAdminsService } from "../services";
import { PLATFORM_ADMINS_QUERY_KEY } from "../constants";
import type { CreatePlatformAdminPayload } from "../types";

export function usePlatformAdmins(params?: { search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: [PLATFORM_ADMINS_QUERY_KEY, "list", params],
    queryFn: () => platformAdminsService.list(params),
  });
}

export function usePlatformAdmin(id: number | null) {
  return useQuery({
    queryKey: [PLATFORM_ADMINS_QUERY_KEY, "detail", id],
    queryFn: () => platformAdminsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePlatformAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlatformAdminPayload) => platformAdminsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLATFORM_ADMINS_QUERY_KEY] }),
  });
}

export function useUpdatePlatformAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: string; status?: string } }) =>
      platformAdminsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLATFORM_ADMINS_QUERY_KEY] }),
  });
}

export function useDeletePlatformAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => platformAdminsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLATFORM_ADMINS_QUERY_KEY] }),
  });
}

export function useBulkDeletePlatformAdmins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => platformAdminsService.bulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLATFORM_ADMINS_QUERY_KEY] }),
  });
}
