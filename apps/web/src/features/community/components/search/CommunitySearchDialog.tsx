"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, MessageSquare, MessagesSquare } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui/AppDialog";
import { AppInput } from "@/components/ui/AppInput";
import { useCommunitySearch } from "../../hooks/useSearch";
import { useFlattenedChannels } from "../../hooks/useChannels";
import { useCommunityStore } from "../../stores/community.store";
import { formatRelativeTime } from "../../utils/time";
import { MemberAvatar } from "../atoms";
import { ChannelIcon } from "../shell/ChannelIcon";

export function CommunitySearchDialog() {
  const open = useCommunityStore((s) => s.searchOpen);
  const setOpen = useCommunityStore((s) => s.setSearchOpen);
  const setActiveChannel = useCommunityStore((s) => s.setActiveChannel);
  const openThread = useCommunityStore((s) => s.openThread);

  const [query, setQuery] = useState("");
  const [channelId, setChannelId] = useState<string>("");
  const channels = useFlattenedChannels();

  const { data, isLoading, searching } = useCommunitySearch({
    q: query,
    channelId: channelId || null,
  });

  const channelName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const channel of channels) map[channel.id] = channel.name;
    return map;
  }, [channels]);

  const messages = data?.messages ?? [];
  const threads = data?.threads ?? [];

  const jumpToMessage = (message: {
    channel_id: string;
    thread_id: string | null;
  }) => {
    if (message.thread_id) {
      openThread(message.thread_id, message.channel_id);
    } else {
      setActiveChannel(message.channel_id);
    }
    setOpen(false);
  };

  return (
    <AppDialog open={open} onOpenChange={setOpen}>
      <AppDialogContent className="max-w-xl">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            البحث في المنتدى
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="flex flex-col gap-3">
          <AppInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن رسائل أو نقاشات…"
            autoFocus
            dir="auto"
          />

          {channels.length > 0 && (
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">كل القنوات</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          )}

          <div className="max-h-[55vh] space-y-3 overflow-y-auto">
            {!searching && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                اكتب حرفين على الأقل للبدء بالبحث.
              </p>
            )}

            {searching && isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ البحث…
              </div>
            )}

            {searching && !isLoading && messages.length === 0 && threads.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                لا توجد نتائج مطابقة.
              </p>
            )}

            {threads.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                  <MessagesSquare className="h-3.5 w-3.5" />
                  نقاشات
                </div>
                <div className="space-y-1">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        openThread(thread.id, thread.channel_id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-accent"
                    >
                      <ChannelIcon slug={thread.channel?.slug} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{thread.title}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {thread.channel?.name} · {thread.messages_count} رد ·{" "}
                          {formatRelativeTime(thread.last_message_at ?? thread.created_at)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  رسائل
                </div>
                <div className="space-y-1">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => jumpToMessage(message)}
                      className="flex w-full items-start gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-accent"
                    >
                      <MemberAvatar
                        name={message.author?.name}
                        avatar={message.avatar ?? message.author?.avatar}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {message.author?.name ?? "عضو"}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatRelativeTime(message.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {message.body_text ?? message.body}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-primary">
                          {channelName[message.channel_id] ?? "قناة"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
