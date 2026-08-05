"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";
import { MESSAGES_PER_PAGE, flattenPages, type MessagesPage } from "./message-cache";
import type { CommunityMessage } from "../types";

/**
 * Infinite message feed for a channel.
 *
 * The backend returns newest-first pages (ordered by descending id). The first
 * page is the newest `per_page` messages; fetching the next page via
 * `before_id` returns the next (older) batch.
 */
export function useChannelMessages(
  channelId: string | null,
  threadId?: string | null,
) {
  const scope = threadId ?? "main";

  const query = useInfiniteQuery({
    queryKey: communityKeys.messages(channelId ?? "", scope),
    queryFn: ({ pageParam }) =>
      communityApi.getMessages(channelId!, {
        thread_id: threadId ?? undefined,
        before_id: pageParam as string | undefined,
        per_page: MESSAGES_PER_PAGE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => {
      const oldest = last.data[last.data.length - 1];
      if (!oldest) return undefined;
      // Fewer than a full page means we reached the beginning of history.
      if (last.data.length < MESSAGES_PER_PAGE) return undefined;
      return oldest.id;
    },
    enabled: Boolean(channelId),
    staleTime: 15_000,
  });

  /** Newest-first flattened messages across all loaded pages. */
  const messages = useMemo(
    () => flattenPages(query.data?.pages ?? null),
    [query.data],
  );

  /** Number of items loaded from "older" pages (used for virtualizer index). */
  const olderCount = useMemo(() => {
    const pages: MessagesPage[] = query.data?.pages ?? [];
    if (pages.length === 0) return 0;
    const newestPageSize = pages[0]!.data.length;
    const total = pages.reduce((sum, p) => sum + p.data.length, 0);
    return Math.max(0, total - newestPageSize);
  }, [query.data]);

  const hasNext = Boolean(query.hasNextPage);

  return { ...query, messages, olderCount, hasNext };
}

/** Fetch a single message (e.g. to jump from a bookmark). */
export function useMessage(messageId: string | null) {
  return useQuery({
    queryKey: communityKeys.message(messageId ?? ""),
    queryFn: () => communityApi.getMessage(messageId!),
    enabled: Boolean(messageId),
  });
}

/** The newest message in a loaded feed — used for read receipts. */
export function useLatestMessageId(
  messages: CommunityMessage[],
): string | null {
  return useMemo(
    () => (messages.length > 0 ? messages[0]!.id : null),
    [messages],
  );
}
