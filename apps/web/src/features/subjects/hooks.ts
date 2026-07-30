"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectsService } from "./services";
import type { SubjectInput } from "./types";

export const subjectsKeys = {
  list: ["subjects", "list"] as const,
  detail: (id: number) => ["subjects", "detail", id] as const,
};

export function useSubjectsList(params?: { inactive?: boolean }) {
  return useQuery({
    queryKey: [...subjectsKeys.list, params ?? {}],
    queryFn: () => subjectsService.list(params),
  });
}

export function useSubject(id: number) {
  return useQuery({
    queryKey: subjectsKeys.detail(id),
    queryFn: () => subjectsService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubjectInput) =>
      subjectsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.list });
      toast.success("تمت إضافة المادة بنجاح");
    },
    onError: () => toast.error("تعذّر إضافة المادة"),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SubjectInput> }) =>
      subjectsService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: subjectsKeys.list });
      qc.invalidateQueries({ queryKey: subjectsKeys.detail(vars.id) });
      toast.success("تم تحديث المادة بنجاح");
    },
    onError: () => toast.error("تعذّر تحديث المادة"),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subjectsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.list });
      toast.success("تم حذف المادة");
    },
    onError: () => toast.error("تعذّر حذف المادة"),
  });
}

export function useReorderSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      subjectsService.reorder(orders),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.list });
    },
    onError: () => toast.error("تعذّر إعادة ترتيب المواد"),
  });
}
