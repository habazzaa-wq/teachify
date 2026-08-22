"use client";

import { ArrowRight, Menu, PanelRight, Search, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCommunityStore } from "../../stores/community.store";
import { useOnlineMembers } from "../../hooks/usePresence";
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
  const { data: online } = useOnlineMembers();

  return (
    <header className="flex items-center gap-2 border-b border-border/70 bg-card/85 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/70">
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChannelIcon slug={channel?.slug} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold leading-tight">
              {channel?.name ?? "منتدى الطلاب"}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {online?.length ?? 0} متصل الآن
              {channel?.description && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="hidden truncate sm:inline">{channel.description}</span>
                </>
              )}
            </div>
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
            "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors",
            rightPaneOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label="لوحة الأعضاء"
          aria-pressed={rightPaneOpen}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">الأعضاء</span>
          <PanelRight className="h-4 w-4 sm:hidden" />
        </button>
      </div>
    </header>
  );
}
