"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { communitySectionService } from "./services";
import { communitySectionKeys } from "./keys";
import type { CommunitySectionSettings } from "./types";

export function usePublicCommunitySection() {
  return useQuery({
    queryKey: communitySectionKeys.public,
    queryFn: communitySectionService.getPublicCommunitySection,
    staleTime: 60_000,
  });
}

export function useCommunitySectionSettings() {
  return useQuery({
    queryKey: communitySectionKeys.settings,
    queryFn: communitySectionService.getCommunitySettings,
  });
}

export function useUpdateCommunitySectionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (community: CommunitySectionSettings) =>
      communitySectionService.updateCommunitySettings(community),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communitySectionKeys.settings });
      qc.invalidateQueries({ queryKey: communitySectionKeys.public });
      toast.success("تم حفظ إعدادات سكشن منتدى الطلاب");
    },
    onError: () => toast.error("تعذّر حفظ الإعدادات"),
  });
}
