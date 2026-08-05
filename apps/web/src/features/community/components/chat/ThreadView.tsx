"use client";

import { ChannelChat } from "./ChannelChat";
import type { CommunityThread } from "../../types";

/**
 * Dedicated thread pane — reuses the channel chat stack but scoped to a
 * thread's messages with a back button to the channel.
 */
export function ThreadView({
  channelId,
  thread,
  onCloseThread,
}: {
  channelId: string;
  thread: CommunityThread | null;
  onCloseThread: () => void;
}) {
  return (
    <ChannelChat
      channelId={channelId}
      thread={thread}
      onCloseThread={onCloseThread}
    />
  );
}
