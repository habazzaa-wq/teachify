"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useChannelMessages, useLatestMessageId } from "../../hooks/useMessages";
import { useMarkRead } from "../../hooks/useMessageActions";
import { useCurrentMember } from "../../hooks/useCurrentMember";
import { useCommunityStore } from "../../stores/community.store";
import { isSameDay } from "../../utils/time";
import { MessageItem } from "./MessageItem";
import { TypingDots, MemberAvatar } from "../atoms";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CommunityMessage } from "../../types";

const EMPTY_TYPING: never[] = [];

interface MessageListProps {
  channelId: string;
  threadId?: string | null;
  onOpenThread?: (message: CommunityMessage) => void;
  onReply?: (message: CommunityMessage) => void;
}

export function MessageList({
  channelId,
  threadId = null,
  onOpenThread,
  onReply,
}: MessageListProps) {
  const {
    messages,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNext,
    olderCount,
  } = useChannelMessages(channelId, threadId);
  const latestId = useLatestMessageId(messages);
  const { markRead } = useMarkRead();
  const { memberId } = useCurrentMember();
  const typingByChannel = useCommunityStore((s) => s.typingByChannel);
  const typingUsers =
    typingByChannel[`${channelId}:${threadId ?? "main"}`] ??
    typingByChannel[channelId] ??
    EMPTY_TYPING;

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const prevCount = useRef(messages.length);
  const didInitialScroll = useRef(false);

  /** Absolute index (with `firstItemIndex` offset) of the newest message. */
  const absoluteEnd = olderCount + messages.length - 1;

  const resolveMessage = useMemo(() => {
    const map = new Map<string, CommunityMessage>();
    for (const m of messages) map.set(m.id, m);
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [messages]);

  // Map message id → position in the feed so itemContent can look up the
  // previous/next message to compute grouping and day dividers.
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    messages.forEach((m, i) => map.set(m.id, i));
    return map;
  }, [messages]);

  // Auto-scroll to the newest message: always on the first load, then only
  // when a new message arrives while we're already at the bottom.
  useEffect(() => {
    if (messages.length === 0) {
      prevCount.current = 0;
      didInitialScroll.current = false;
      return;
    }
    if (!didInitialScroll.current) {
      didInitialScroll.current = true;
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: olderCount + messages.length - 1,
          behavior: "auto",
          align: "end",
        });
      });
      prevCount.current = messages.length;
      return;
    }
    if (messages.length > prevCount.current && atBottom) {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: olderCount + messages.length - 1,
          behavior: "smooth",
          align: "end",
        });
      });
    }
    prevCount.current = messages.length;
  }, [messages.length, olderCount, atBottom]);

  // Best-effort read receipt when the newest message is in view.
  const markLatestRead = useCallback(() => {
    if (latestId && atBottom) {
      markRead({ channelId, messageId: latestId, threadId });
    }
  }, [latestId, atBottom, channelId, threadId, markRead]);

  useEffect(() => {
    markLatestRead();
  }, [markLatestRead]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ArrowDown className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">لا توجد رسائل بعد</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          كن أول من يبدأ النقاش في هذه القناة.
        </p>
      </div>
    );
  }

  const typingNames = typingUsers
    .filter((u) => u.memberId !== memberId)
    .map((u) => u.name)
    .filter(Boolean);

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--border) / 0.55) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        firstItemIndex={olderCount}
        initialTopMostItemIndex={{
          index: Math.max(0, absoluteEnd),
          align: "end",
        }}
        increaseViewportBy={{ top: 400, bottom: 100 }}
        rangeChanged={(range) => {
          const bottom = range.endIndex >= Math.max(0, absoluteEnd);
          setAtBottom(bottom);
          if (bottom && latestId) {
            markRead({ channelId, messageId: latestId, threadId });
          }
        }}
        startReached={() => {
          if (hasNext && !isFetchingNextPage) void fetchNextPage();
        }}
        computeItemKey={(_, message) => message.id}
        itemContent={(_, message) => {
          const i = indexById.get(message.id) ?? -1;
          const prev = i > 0 ? messages[i - 1] : undefined;
          const next = i >= 0 && i < messages.length - 1 ? messages[i + 1] : undefined;
          const groupStart = !prev || prev.author?.id !== message.author?.id;
          const groupEnd = !next || next.author?.id !== message.author?.id;
          const showDayDivider =
            !prev || !isSameDay(prev.created_at, message.created_at);
          return (
            <MessageItem
              message={message}
              resolveMessage={resolveMessage}
              onReply={onReply ?? (() => undefined)}
              onOpenThread={onOpenThread ?? (() => undefined)}
              groupStart={groupStart}
              groupEnd={groupEnd}
              showDayDivider={showDayDivider}
            />
          );
        }}
        components={{
          Header: () =>
            isFetchingNextPage ? (
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  جارٍ تحميل رسائل أقدم…
                </div>
              </div>
            ) : null,
          Footer: () =>
            typingNames.length > 0 ? (
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MemberAvatar
                    name={typingNames[0]}
                    avatar={null}
                    size="xs"
                    className="animate-pulse"
                  />
                  <span className="font-medium">{typingNames.join("، ")}</span>
                  <span>يكتب</span>
                  <TypingDots className="text-primary" />
                </div>
              </div>
            ) : null,
        }}
      />

      {/* Jump-to-newest button */}
      {!atBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={() =>
            virtuosoRef.current?.scrollToIndex({
              index: Math.max(0, absoluteEnd),
              behavior: "smooth",
              align: "end",
            })
          }
          className={cn(
            "absolute bottom-4 start-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border bg-background text-foreground shadow-lg transition-transform hover:scale-105",
            "rtl:translate-x-1/2 ltr:-translate-x-1/2",
          )}
          aria-label="الانتقال لأحدث الرسائل"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
