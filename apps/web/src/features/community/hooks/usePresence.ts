"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";

export function useOnlineMembers(channelId?: string | null) {
  return useQuery({
    queryKey: [...communityKeys.presence(), channelId ?? "all"],
    queryFn: () => communityApi.onlineMembers(channelId ?? null),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

const TYPING_THROTTLE_MS = 2_000;

/**
 * Sends "typing" notifications with throttling — at most one network call per
 * 2s per channel while the user keeps typing.
 */
export function useTypingSender() {
  const lastSent = useRef<Record<string, number>>({});

  const send = useCallback((channelId: string, threadId?: string | null) => {
    const key = `${channelId}:${threadId ?? "main"}`;
    const now = Date.now();
    if (now - (lastSent.current[key] ?? 0) < TYPING_THROTTLE_MS) return;
    lastSent.current[key] = now;
    void communityApi.typing(channelId, threadId).catch(() => {
      // ignore typing failures
    });
  }, []);

  return send;
}

/** Fire-and-forget presence pulse while the community page is mounted. */
export function usePresencePulse(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    const pulse = () => {
      void communityApi.presenceOnline("online").catch(() => {
        // ignore
      });
    };

    pulse();
    const interval = window.setInterval(pulse, 60_000);

    const shutdown = () => {
      stopped = true;
      window.clearInterval(interval);
      void communityApi.presenceOffline().catch(() => {
        // ignore
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        pulse();
      } else if (document.visibilityState === "hidden") {
        // Don't tear down; the server times stale presence out on its own.
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onUnload = () => shutdown();
    window.addEventListener("beforeunload", onUnload);

    return () => {
      if (!stopped) shutdown();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [enabled]);
}
