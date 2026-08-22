"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { educationalStagesService } from "./services";
import { stagesKeys } from "./keys";
import type { EducationalStageInput, StageStats } from "./types";

export function usePublicStages() {
  return useQuery({
    queryKey: stagesKeys.public,
    queryFn: educationalStagesService.getPublicStages,
    staleTime: 30_000,
  });
}

/** Real per-stage stats (courses + teachers counts). */
export function useStageStats(stageId: number) {
  return useQuery({
    queryKey: stagesKeys.stats(stageId),
    queryFn: () => educationalStagesService.getStageStats(stageId),
    enabled: Number.isFinite(stageId) && stageId > 0,
    staleTime: 120_000,
    gcTime: 10 * 60_000,
  });
}

/** Parallel stats for many stages; fetches only when `enabled` (section in view). */
export function useStageStatsQueries(stageIds: number[], enabled: boolean) {
  return useQueries({
    queries: stageIds.map((id) => ({
      queryKey: stagesKeys.stats(id),
      queryFn: () => educationalStagesService.getStageStats(id),
      enabled: enabled && Number.isFinite(id) && id > 0,
      staleTime: 120_000,
      gcTime: 10 * 60_000,
    })),
  });
}

/** Stats map + set of ids still loading (first fetch). */
export function useStageStatsState(
  stageIds: number[],
  enabled: boolean,
): { statsById: Map<number, StageStats>; loadingIds: Set<number> } {
  const results = useStageStatsQueries(stageIds, enabled);

  return useMemo(() => {
    const statsById = new Map<number, StageStats>();
    const loadingIds = new Set<number>();

    stageIds.forEach((id, index) => {
      const result = results[index];
      if (result?.data) {
        statsById.set(id, result.data);
      }
      if (result?.isLoading) {
        loadingIds.add(id);
      }
    });

    return { statsById, loadingIds };
  }, [stageIds, results]);
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
