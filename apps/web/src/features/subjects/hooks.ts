"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectsService } from "./services";
import { instructorApi } from "@/features/instructors/api";
import type { SubjectInput, SubjectRecord } from "./types";

type SubjectList = Awaited<ReturnType<typeof subjectsService.list>>;
type InstructorSubjectList = {
  data: Pick<SubjectRecord, "id" | "name" | "is_active">[];
  total: number;
};

export const subjectsKeys = {
  list: ["subjects", "list"] as const,
  detail: (id: number) => ["subjects", "detail", id] as const,
};

export function useSubjectsList(
  params?: { inactive?: boolean },
): UseQueryResult<SubjectList>;
export function useSubjectsList(
  params: { inactive?: boolean } | undefined,
  instructorToken: string | null | undefined,
): UseQueryResult<SubjectList | InstructorSubjectList>;
export function useSubjectsList(
  params?: { inactive?: boolean },
  instructorToken?: string | null,
): UseQueryResult<SubjectList | InstructorSubjectList> {
  return useQuery<SubjectList | InstructorSubjectList>({
    queryKey: [...subjectsKeys.list, params ?? {}, instructorToken ? "instructor" : "tenant"],
    queryFn: async () => {
      if (!instructorToken) return subjectsService.list(params);
      const { data } = await instructorApi.courseLookups(instructorToken);
      return { data: data.subjects, total: data.subjects.length };
    },
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
