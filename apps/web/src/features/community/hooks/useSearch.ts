"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";

export interface SearchFilters {
  q: string;
  channelId?: string | null;
  authorId?: string | null;
  hasAttachments?: boolean;
}

const DEBOUNCE_MS = 350;

/** Debounced community search across messages and threads. */
export function useCommunitySearch(filters: SearchFilters) {
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQ(filters.q), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [filters.q]);

  const trimmed = debouncedQ.trim();

  const query = useQuery({
    queryKey: communityKeys.search(trimmed),
    queryFn: () =>
      communityApi.search({
        q: trimmed,
        channel_id: filters.channelId ?? undefined,
        author_id: filters.authorId ?? undefined,
        has_attachments: filters.hasAttachments,
        per_page: 30,
      }),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });

  return useMemo(() => ({ ...query, searching: trimmed.length >= 2 }), [query, trimmed]);
}
