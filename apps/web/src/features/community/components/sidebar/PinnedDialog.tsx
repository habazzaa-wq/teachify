"use client";

import { Loader2, Pin } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle } from "@/components/ui/AppDialog";
import { communityApi } from "../../api/community.api";
import { communityKeys } from "../../queryKeys";
import { useFlattenedChannels } from "../../hooks/useChannels";
import { useCommunityStore } from "../../stores/community.store";
import { formatRelativeTime } from "../../utils/time";
import { MemberAvatar } from "../atoms";

export function PinnedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const channels = useFlattenedChannels();
  const setActiveChannel = useCommunityStore((s) => s.setActiveChannel);

  const { data: pinned, isLoading } = useQuery({
    queryKey: communityKeys.pinnedMessages(),
    queryFn: async () => {
      const results = await Promise.all(
        channels.map((channel) =>
          communityApi
            .getMessages(channel.id, { pinned_only: true, per_page: 10 })
            .catch(() => []),
        ),
      );
      return results.flat().sort((a, b) => Number(b.id) - Number(a.id));
    },
    enabled: open && channels.length > 0,
    staleTime: 30_000,
  });

  const byChannel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const channel of channels) map[channel.id] = channel.name;
    return map;
  }, [channels]);

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary" />
            الرسائل المثبتة
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحميل…
            </div>
          )}
          {!isLoading && pinned?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد رسائل مثبتة حالياً.
            </p>
          )}
          {pinned?.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => {
                setActiveChannel(message.channel_id);
                onOpenChange(false);
              }}
              className="flex w-full items-start gap-3 rounded-xl p-3 text-start transition-colors hover:bg-accent"
            >
              <MemberAvatar name={message.author?.name} avatar={message.author?.avatar} size="sm" />
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
                <span className="mt-1 block text-[10px] font-semibold text-primary">
                  {byChannel[message.channel_id] ?? "قناة"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
