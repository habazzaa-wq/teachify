"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";
import type { CommunityCategory, CommunityChannel } from "../types";

export function useCommunityCategories() {
  return useQuery({
    queryKey: communityKeys.categories(),
    queryFn: communityApi.getCategories,
    staleTime: 60_000,
  });
}

/** All channels flattened from the category tree. */
export function useFlattenedChannels(): CommunityChannel[] {
  const { data: categories } = useCommunityCategories();
  return useMemo(
    () => categories?.flatMap((c: CommunityCategory) => c.channels ?? []) ?? [],
    [categories],
  );
}

/** Channels that are allowed for the current member (non moderator-only). */
export function useAccessibleChannels(): CommunityChannel[] {
  const { data: categories } = useCommunityCategories();
  return useMemo(
    () =>
      categories?.flatMap((c: CommunityCategory) =>
        (c.channels ?? []).filter(
          (channel) => channel.status === "active" && !channel.is_locked,
        ),
      ) ?? [],
    [categories],
  );
}

export function useChannel(channelId: string | null) {
  return useQuery({
    queryKey: communityKeys.channel(channelId ?? ""),
    queryFn: () => communityApi.getChannel(channelId!),
    enabled: Boolean(channelId),
    staleTime: 60_000,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: communityKeys.announcements(),
    queryFn: communityApi.announcements,
    staleTime: 30_000,
  });
}
