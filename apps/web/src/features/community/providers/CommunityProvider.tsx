"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCommunityCategories } from "../hooks/useChannels";
import { useCommunityRealtime } from "../hooks/useRealtime";
import { usePresencePulse } from "../hooks/usePresence";
import { useCurrentMember } from "../hooks/useCurrentMember";
import { isExamBlockedError } from "../api/community.api";
import { useCommunityStore } from "../stores/community.store";

interface CommunityContextValue {
  tenantId: string | null;
  ready: boolean;
}

const CommunityContext = createContext<CommunityContextValue>({
  tenantId: null,
  ready: false,
});

export function useCommunityContext(): CommunityContextValue {
  return useContext(CommunityContext);
}

/**
 * Wires community data + realtime for the whole feature.
 * Mounted inside an authenticated layout (tenant resolved).
 */
export function CommunityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore(
    (state) => state.activeTenant?.id?.toString() ?? null,
  );
  const status = useAuthStore((state) => state.status);

  const activeChannelId = useCommunityStore((s) => s.activeChannelId);
  const activeThreadId = useCommunityStore((s) => s.activeThreadId);
  const setExamBlocked = useCommunityStore((s) => s.setExamBlocked);

  const { memberId } = useCurrentMember();
  const enabled = Boolean(tenantId) && status === "authenticated";

  const { data: categories, error: categoriesError } =
    useCommunityCategories();

  useEffect(() => {
    if (categoriesError && isExamBlockedError(categoriesError)) {
      setExamBlocked(true);
    }
  }, [categoriesError, setExamBlocked]);

  // Guard any unexpected 422 "community" error by flipping the exam screen.
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      const query = event.query;
      if (!query || query.state.status !== "error") return;
      if (isExamBlockedError(query.state.error)) {
        setExamBlocked(true);
      }
    });
    return () => unsub();
  }, [queryClient, setExamBlocked]);

  const channelIds = useMemo(
    () =>
      categories?.flatMap((c) => c.channels.map((ch) => ch.id)) ?? [],
    [categories],
  );

  useCommunityRealtime({
    enabled,
    tenantId,
    channelIds,
    activeChannelId,
    activeThreadId,
  });

  usePresencePulse(enabled && Boolean(memberId));

  const value = useMemo(
    () => ({ tenantId, ready: enabled && channelIds.length > 0 }),
    [tenantId, enabled, channelIds.length],
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}
