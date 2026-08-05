"use client";

import { useState } from "react";
import { useChannel } from "../../hooks/useChannels";
import type { CommunityMessage, CommunityThread } from "../../types";
import { MessageActionsProvider } from "./MessageActionsContext";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { ChannelHeader } from "./ChannelHeader";

interface ChannelChatProps {
  channelId: string;
  thread?: CommunityThread | null;
  onOpenThread?: (message: CommunityMessage) => void;
  onCloseThread?: () => void;
}

/**
 * Full chat pane for a channel (or thread): header + messages + composer.
 * Owns the "replying to" state shared between the list and the composer.
 */
export function ChannelChat({
  channelId,
  thread = null,
  onOpenThread,
  onCloseThread,
}: ChannelChatProps) {
  const { data: channel } = useChannel(channelId);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);

  return (
    <MessageActionsProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <ChannelHeader
          channel={channel ?? null}
          thread={thread}
          onCloseThread={onCloseThread}
        />
        <MessageList
          channelId={channelId}
          threadId={thread?.id ?? null}
          onOpenThread={onOpenThread}
          onReply={setReplyingTo}
        />
        <Composer
          channelId={channelId}
          threadId={thread?.id ?? null}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </MessageActionsProvider>
  );
}
