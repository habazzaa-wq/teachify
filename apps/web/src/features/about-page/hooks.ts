"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { aboutPageService } from "./services";
import type { AboutPageSettings } from "./types";

export const aboutPageKeys = {
  public: ["about-page", "public"] as const,
  settings: ["about-page", "settings"] as const,
};

export function usePublicAboutPage() {
  return useQuery({
    queryKey: aboutPageKeys.public,
    queryFn: aboutPageService.getPublicAbout,
    staleTime: 60_000,
  });
}

export function useAboutPageSettings() {
  return useQuery({
    queryKey: aboutPageKeys.settings,
    queryFn: aboutPageService.getAboutSettings,
  });
}

export function useUpdateAboutPageSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: AboutPageSettings) => aboutPageService.updateAboutSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutPageKeys.settings });
      queryClient.invalidateQueries({ queryKey: aboutPageKeys.public });
      toast.success("تم حفظ صفحة من نحن");
    },
    onError: () => toast.error("تعذّر حفظ صفحة من نحن"),
  });
}
