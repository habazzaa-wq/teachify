"use client";

import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";

export function useGamificationMe() {
  return useQuery({
    queryKey: communityKeys.gamification.me(),
    queryFn: communityApi.gamificationMe,
    staleTime: 30_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: communityKeys.gamification.leaderboard(),
    queryFn: communityApi.leaderboard,
    staleTime: 60_000,
  });
}
