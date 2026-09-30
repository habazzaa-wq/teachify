"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { footerService } from "./services";
import { footerKeys } from "./query-keys";
import type { FooterSettings } from "./types";
import { mergeFooterSettings } from "./types";

export function useMergedPublicFooter() {
  const { data, ...rest } = useQuery({
    queryKey: footerKeys.public,
    queryFn: footerService.getPublicFooter,
    staleTime: 60_000,
  });
  return { data: mergeFooterSettings(data), ...rest };
}

export function useFooterSettings() {
  const { data, ...rest } = useQuery({
    queryKey: footerKeys.settings,
    queryFn: footerService.getFooterSettings,
  });
  return { data: mergeFooterSettings(data), ...rest };
}

export function useUpdateFooterSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: FooterSettings) => footerService.updateFooterSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: footerKeys.settings });
      qc.invalidateQueries({ queryKey: footerKeys.public });
      toast.success("تم حفظ محتوى الفوتر");
    },
    onError: () => toast.error("تعذّر حفظ محتوى الفوتر"),
  });
}