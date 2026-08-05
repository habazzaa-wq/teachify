"use client";

import { ArrowRight, Menu, PanelRight, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCommunityStore } from "../../stores/community.store";
import type { CommunityChannel, CommunityThread } from "../../types";
import { ChannelIcon } from "../shell/ChannelIcon";
import { NotificationBell } from "../notifications/NotificationBell";

interface ChannelHeaderProps {
  channel: CommunityChannel | null;
  thread?: CommunityThread | null;
  onCloseThread?: () => void;
}

export function ChannelHeader({ channel, thread, onCloseThread }: ChannelHeaderProps) {
  const setMobileChannelsOpen = useCommunityStore((s) => s.setMobileChannelsOpen);
  const setSearchOpen = useCommunityStore((s) => s.setSearchOpen);
  const rightPaneOpen = useCommunityStore((s) => s.rightPaneOpen);
  const setRightPaneOpen = useCommunityStore((s) => s.setRightPaneOpen);

  return (
    <header className="flex items-center gap-2 border-b bg-card/80 px-3 py-2.5 backdrop-blur">
      <button
        type="button"
        onClick={() => setMobileChannelsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted lg:hidden"
        aria-label="القنوات"
      >
        <Menu className="h-5 w-5" />
      </button>

      {thread ? (
        <>
          <button
            type="button"
            onClick={onCloseThread}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
            aria-label="رجوع للقناة"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold">{thread.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {channel?.name ?? "منتدى الطلاب"} · نقاش
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ChannelIcon slug={channel?.slug} />
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold">
              {channel?.name ?? "منتدى الطلاب"}
            </div>
            {channel?.description && (
              <div className="hidden truncate text-[10px] text-muted-foreground sm:block">
                {channel.description}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="بحث"
        >
          <Search className="h-5 w-5" />
        </button>
        <NotificationBell />
        <button
          type="button"
          onClick={() => setRightPaneOpen(!rightPaneOpen)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            rightPaneOpen && "text-primary",
          )}
          aria-label="لوحة الأعضاء"
        >
          <PanelRight className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
