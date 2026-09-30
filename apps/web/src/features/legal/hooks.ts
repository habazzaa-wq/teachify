"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { legalService } from "./services";
import { legalKeys } from "./query-keys";
import type { LegalContent, LegalDocumentType } from "./types";
import { mergeLegalSettings } from "./types";

export function usePublicLegal() {
  return useQuery({
    queryKey: legalKeys.public,
    queryFn: legalService.getPublicLegal,
    staleTime: 60_000,
  });
}

export function useLegalSettings() {
  return useQuery({
    queryKey: legalKeys.settings,
    queryFn: legalService.getLegalSettings,
  });
}

export function useMergedLegalSettings() {
  const { data, ...rest } = useLegalSettings();
  return { data: mergeLegalSettings(data), ...rest };
}

export function useUpdateLegalSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, content }: { type: LegalDocumentType; content: LegalContent }) =>
      legalService.updateLegalContent(type, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: legalKeys.settings });
      qc.invalidateQueries({ queryKey: legalKeys.public });
      toast.success(
        variables.type === "privacy" ? "تم حفظ صفحة سياسة الخصوصية" : "تم حفظ صفحة شروط الاستخدام",
      );
    },
    onError: () => toast.error("تعذّر حفظ الصفحة"),
  });
}