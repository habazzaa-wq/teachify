"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useChannelMessages, useLatestMessageId } from "../../hooks/useMessages";
import { useMarkRead } from "../../hooks/useMessageActions";
import { useCurrentMember } from "../../hooks/useCurrentMember";
import { useCommunityStore } from "../../stores/community.store";
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
  const { messages, isLoading, isFetchingNextPage, fetchNextPage, hasNext } =
    useChannelMessages(channelId, threadId);
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

  const resolveMessage = useMemo(() => {
    const map = new Map<string, CommunityMessage>();
    for (const m of messages) map.set(m.id, m);
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [messages]);

  // Auto-scroll to the newest message when it arrives and we're at the bottom.
  useEffect(() => {
    if (messages.length > prevCount.current && atBottom) {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: "smooth",
          align: "end",
        });
      });
    }
    prevCount.current = messages.length;
  }, [messages.length, atBottom]);

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
    <div className="relative flex-1 overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        increaseViewportBy={{ top: 400, bottom: 100 }}
        rangeChanged={(range) => {
          const bottom = range.endIndex >= Math.max(0, messages.length - 1);
          setAtBottom(bottom);
          if (bottom && latestId) {
            markRead({ channelId, messageId: latestId, threadId });
          }
        }}
        startReached={() => {
          if (hasNext && !isFetchingNextPage) void fetchNextPage();
        }}
        computeItemKey={(_, message) => message.id}
        itemContent={(_, message) => (
          <MessageItem
            message={message}
            resolveMessage={resolveMessage}
            onReply={onReply ?? (() => undefined)}
            onOpenThread={onOpenThread ?? (() => undefined)}
          />
        )}
        components={{
          Footer: () => (
            <div className="px-4 py-2">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  جارٍ تحميل رسائل أقدم…
                </div>
              )}
              {typingNames.length > 0 && (
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
              )}
            </div>
          ),
        }}
      />

      {/* Jump-to-newest button */}
      {!atBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={() =>
            virtuosoRef.current?.scrollToIndex({
              index: messages.length - 1,
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
