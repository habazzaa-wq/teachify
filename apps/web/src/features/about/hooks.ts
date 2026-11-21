"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { aboutKeys } from "./query-keys";
import { aboutService } from "./services";
import { mergeAboutSettings } from "./types";
import type { AboutSettings } from "./types";

export function usePublicAbout() {
  const { data, ...rest } = useQuery({
    queryKey: aboutKeys.public,
    queryFn: aboutService.getPublicAbout,
    staleTime: 60_000,
  });

  return { data: mergeAboutSettings(data), ...rest };
}

export function useAboutSettings() {
  const { data, ...rest } = useQuery({
    queryKey: aboutKeys.settings,
    queryFn: aboutService.getAboutSettings,
  });

  return { data: mergeAboutSettings(data), ...rest };
}

export function useUpdateAboutSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (settings: AboutSettings) => aboutService.updateAboutSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aboutKeys.settings });
      qc.invalidateQueries({ queryKey: aboutKeys.public });
      toast.success("تم حفظ محتوى صفحة من نحن");
    },
    onError: () => toast.error("تعذّر حفظ محتوى صفحة من نحن"),
  });
}
