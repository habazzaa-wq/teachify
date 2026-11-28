"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { announceHeroUpdate, subscribeToHeroUpdates } from "./cache-sync";
import { heroService } from "./services";
import { heroKeys } from "./query-keys";
import type { HeroSettings } from "./types";

export function usePublicHero() {
  const qc = useQueryClient();

  useEffect(
    () =>
      subscribeToHeroUpdates(() => {
        void qc.invalidateQueries({ queryKey: heroKeys.public });
      }),
    [qc],
  );

  return useQuery({
    queryKey: heroKeys.public,
    queryFn: heroService.getPublicHero,
    // SSR data is no-store and already fresh; never freeze public copy in a
    // client cache for a minute after an admin saves in another tab.
    staleTime: 0,
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
      // Other tabs (including an open public homepage) keep their own query
      // cache; notify them so the saved copy appears without a manual reload.
      announceHeroUpdate();
      toast.success("تم حفظ إعدادات البطاقة التعريفية");
    },
    onError: () => toast.error("تعذّر حفظ الإعدادات"),
  });
}
