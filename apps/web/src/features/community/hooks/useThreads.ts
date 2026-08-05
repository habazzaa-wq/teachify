"use client";

import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";

export function useChannelThreads(channelId: string | null) {
  return useQuery({
    queryKey: communityKeys.threads(channelId ?? ""),
    queryFn: () => communityApi.getThreads(channelId!),
    enabled: Boolean(channelId),
    staleTime: 30_000,
  });
}

export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: communityKeys.thread(threadId ?? ""),
    queryFn: () => communityApi.getThread(threadId!),
    enabled: Boolean(threadId),
    staleTime: 30_000,
  });
}
