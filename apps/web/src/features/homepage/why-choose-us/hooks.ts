"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { whyChooseUsService } from "./services";
import { whyChooseUsKeys } from "./keys";
import type { WhyChooseUsSettings } from "./types";

export function usePublicWhyChooseUs() {
  return useQuery({
    queryKey: whyChooseUsKeys.public,
    queryFn: whyChooseUsService.getPublicWhyChooseUs,
    staleTime: 60_000,
  });
}

export function useWhyChooseUsSettings() {
  return useQuery({
    queryKey: whyChooseUsKeys.settings,
    queryFn: whyChooseUsService.getWhyChooseUsSettings,
  });
}

export function useUpdateWhyChooseUsSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (whyChooseUs: WhyChooseUsSettings) =>
      whyChooseUsService.updateWhyChooseUsSettings(whyChooseUs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whyChooseUsKeys.settings });
      qc.invalidateQueries({ queryKey: whyChooseUsKeys.public });
      toast.success("تم حفظ إعدادات قسم لماذا تختارنا");
    },
    onError: () => toast.error("تعذّر حفظ الإعدادات"),
  });
}
