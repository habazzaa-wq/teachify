"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";
import type { CommunityStatsMap } from "../types";

export const STAT_KEYS = {
  ACTIVE_MEMBERS: "active_members",
  ONLINE_MEMBERS: "online_members",
  TODAY_MESSAGES: "today_messages",
  TOTAL_MESSAGES: "total_messages",
  TOTAL_THREADS: "total_threads",
  TOTAL_REACTIONS: "total_reactions",
  LATEST_MESSAGE: "latest_message",
} as const;

export function useCommunityStats() {
  return useQuery({
    queryKey: communityKeys.stats(),
    queryFn: communityApi.stats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Stats array → convenient key→value map. */
export function useCommunityStatsMap(): CommunityStatsMap {
  const { data } = useCommunityStats();

  return useMemo(() => {
    const map: CommunityStatsMap = {};
    for (const stat of data ?? []) {
      if (stat.key === STAT_KEYS.LATEST_MESSAGE && stat.payload) {
        map[stat.key] = stat.payload as unknown as CommunityStatsMap["latest_message"];
      } else {
        map[stat.key] = stat.value;
      }
    }
    return map;
  }, [data]);
}
