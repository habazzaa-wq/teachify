"use client";

import { MessagesSquare } from "lucide-react";
import { toast } from "@/lib/toast";
import { useCommunityStore } from "../../stores/community.store";
import { useThread } from "../../hooks/useThreads";
import { ThreadView } from "./ThreadView";
import { ChannelChat } from "./ChannelChat";
import type { CommunityMessage } from "../../types";

/**
 * Main chat pane: renders the active channel's chat, or the active thread's
 * dedicated view when a thread is open.
 */
export function MainChat() {
  const activeChannelId = useCommunityStore((s) => s.activeChannelId);
  const activeThreadId = useCommunityStore((s) => s.activeThreadId);
  const openThread = useCommunityStore((s) => s.openThread);
  const closeThread = useCommunityStore((s) => s.closeThread);
  const { data: thread } = useThread(activeThreadId);

  const handleOpenThread = (message: CommunityMessage) => {
    const threadId = message.thread_id ?? (message.thread_count > 0 ? message.id : null);
    if (threadId && message.channel_id) {
      openThread(threadId, message.channel_id);
    } else {
      toast.info("لا توجد ردود على هذه الرسالة بعد. ابدأ نقاشاً جديداً من الأسفل.");
    }
  };

  if (!activeChannelId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <MessagesSquare className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-bold">اختر قناة للبدء</p>
          <p className="text-xs text-muted-foreground">
            من القائمة الجانبية اختر القناة التي تريد الانضمام إليها.
          </p>
        </div>
      </div>
    );
  }

  if (activeThreadId) {
    return (
      <ThreadView
        channelId={thread?.channel_id ?? activeChannelId}
        thread={thread ?? null}
        onCloseThread={closeThread}
      />
    );
  }

  return (
    <ChannelChat
      channelId={activeChannelId}
      onOpenThread={handleOpenThread}
    />
  );
}
