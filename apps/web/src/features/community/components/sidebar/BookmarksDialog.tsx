"use client";

import { Loader2, Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle } from "@/components/ui/AppDialog";
import { communityApi } from "../../api/community.api";
import { communityKeys } from "../../queryKeys";
import { useCommunityStore } from "../../stores/community.store";
import { formatRelativeTime } from "../../utils/time";
import { MemberAvatar } from "../atoms";

export function BookmarksDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: communityKeys.bookmarks(),
    queryFn: communityApi.getBookmarks,
    staleTime: 30_000,
    enabled: open,
  });
  const openThread = useCommunityStore((s) => s.openThread);
  const setActiveChannel = useCommunityStore((s) => s.setActiveChannel);

  const jump = (message?: { channel_id: string; thread_id: string | null } | null) => {
    if (!message?.channel_id) return;
    if (message.thread_id) {
      openThread(message.thread_id, message.channel_id);
    } else {
      setActiveChannel(message.channel_id);
    }
    onOpenChange(false);
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            المفضلة
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحميل…
            </div>
          )}
          {!isLoading && bookmarks?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد رسائل مفضلة بعد. اضغط على أيقونة المفضلة في رسالة لحفظها.
            </p>
          )}
          {bookmarks?.map((b) => {
            const message = b.message;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => jump(message)}
                className="flex w-full items-start gap-3 rounded-xl p-3 text-start transition-colors hover:bg-accent"
              >
                <MemberAvatar name={message?.author?.name} avatar={message?.author?.avatar} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {message?.author?.name ?? "عضو"}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {message ? formatRelativeTime(message.created_at) : ""}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                    {message?.body_text ?? b.note ?? "رسالة"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
