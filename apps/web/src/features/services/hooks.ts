"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantServicesApi } from "./api";
import type { ServicePayload } from "./types";

export const tenantServicesKeys = {
  all: ["tenant-services"] as const,
  list: ["tenant-services", "list"] as const,
  instructors: ["tenant-services", "instructors"] as const,
};

function getApiMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string } } }
    ).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function useTenantServices() {
  return useQuery({
    queryKey: tenantServicesKeys.list,
    queryFn: tenantServicesApi.list,
  });
}

export function useServiceInstructors() {
  return useQuery({
    queryKey: tenantServicesKeys.instructors,
    queryFn: tenantServicesApi.instructors,
  });
}

function useInvalidateServices() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: tenantServicesKeys.all });
}

export function useSaveService() {
  const invalidate = useInvalidateServices();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | null;
      payload: ServicePayload;
    }) =>
      id === null
        ? tenantServicesApi.create(payload)
        : tenantServicesApi.update(id, payload),
    onSuccess: async (_result, variables) => {
      await invalidate();
      toast.success(
        variables.id === null
          ? "تمت إضافة الخدمة بنجاح"
          : "تم حفظ التعديلات بنجاح",
      );
    },
    onError: (error: unknown) => {
      toast.error(
        getApiMessage(error, "تعذّر حفظ الخدمة. راجع البيانات وحاول مرة أخرى."),
      );
    },
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateServices();

  return useMutation({
    mutationFn: (id: number) => tenantServicesApi.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("تم حذف الخدمة");
    },
    onError: () => toast.error("تعذّر حذف الخدمة"),
  });
}
