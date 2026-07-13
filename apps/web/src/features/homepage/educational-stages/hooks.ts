"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { educationalStagesService } from "./services";
import type { EducationalStageInput } from "./types";

export const stagesKeys = {
  public: ["stages", "public"] as const,
  list: ["stages", "list"] as const,
  detail: (id: number) => ["stages", "detail", id] as const,
};

export function usePublicStages() {
  return useQuery({
    queryKey: stagesKeys.public,
    queryFn: educationalStagesService.getPublicStages,
    staleTime: 30_000,
  });
}

export function useEducationalStagesList(params?: { inactive?: boolean }) {
  return useQuery({
    queryKey: [...stagesKeys.list, params ?? {}],
    queryFn: () => educationalStagesService.list(params),
  });
}

export function useEducationalStage(id: number) {
  return useQuery({
    queryKey: stagesKeys.detail(id),
    queryFn: () => educationalStagesService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateEducationalStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EducationalStageInput) =>
      educationalStagesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stagesKeys.list });
      qc.invalidateQueries({ queryKey: stagesKeys.public });
      toast.success("تمت إضافة المرحلة الدراسية بنجاح");
    },
    onError: () => toast.error("تعذّر إضافة المرحلة الدراسية"),
  });
}

export function useUpdateEducationalStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EducationalStageInput> }) =>
      educationalStagesService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: stagesKeys.list });
      qc.invalidateQueries({ queryKey: stagesKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: stagesKeys.public });
      toast.success("تم تحديث المرحلة الدراسية بنجاح");
    },
    onError: () => toast.error("تعذّر تحديث المرحلة الدراسية"),
  });
}

export function useDeleteEducationalStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => educationalStagesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stagesKeys.list });
      qc.invalidateQueries({ queryKey: stagesKeys.public });
      toast.success("تم حذف المرحلة الدراسية");
    },
    onError: () => toast.error("تعذّر حذف المرحلة الدراسية"),
  });
}

export function useReorderEducationalStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      educationalStagesService.reorder(orders),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stagesKeys.list });
      qc.invalidateQueries({ queryKey: stagesKeys.public });
    },
    onError: () => toast.error("تعذّر إعادة ترتيب المراحل الدراسية"),
  });
}
