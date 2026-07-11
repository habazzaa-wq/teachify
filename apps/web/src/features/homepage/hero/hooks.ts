"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { heroService } from "./services";
import type { HeroSettings } from "./types";

export const heroKeys = {
  public: ["hero", "public"] as const,
  settings: ["hero", "settings"] as const,
};

export function usePublicHero() {
  return useQuery({
    queryKey: heroKeys.public,
    queryFn: heroService.getPublicHero,
    staleTime: 60_000,
  });
}

export function useHeroSettings() {
  return useQuery({
    queryKey: heroKeys.settings,
    queryFn: heroService.getHeroSettings,
  });
}

export function useUpdateHeroSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hero: HeroSettings) => heroService.updateHeroSettings(hero),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: heroKeys.settings });
      qc.invalidateQueries({ queryKey: heroKeys.public });
      toast.success("تم حفظ إعدادات البطاقة التعريفية");
    },
    onError: () => toast.error("تعذّر حفظ الإعدادات"),
  });
}
