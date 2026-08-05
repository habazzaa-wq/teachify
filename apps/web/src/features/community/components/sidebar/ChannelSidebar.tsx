"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  Loader2,
  Lock,
  Megaphone,
  Pin,
  Search,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useCommunityCategories, useAnnouncements } from "../../hooks/useChannels";
import { useCommunityStore } from "../../stores/community.store";
import { formatRelativeTime } from "../../utils/time";
import { ChannelIcon } from "../shell/ChannelIcon";
import { BookmarksDialog } from "./BookmarksDialog";
import { PinnedDialog } from "./PinnedDialog";

function UnreadBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function ChannelSidebar() {
  const categoriesQuery = useCommunityCategories();
  const announcements = useAnnouncements();
  const setMobileChannelsOpen = useCommunityStore((s) => s.setMobileChannelsOpen);
  const setSearchOpen = useCommunityStore((s) => s.setSearchOpen);

  const activeChannelId = useCommunityStore((s) => s.activeChannelId);
  const unreadByChannel = useCommunityStore((s) => s.unreadByChannel);
  const connection = useCommunityStore((s) => s.connection);
  const examBlocked = useCommunityStore((s) => s.examBlocked);

  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  const totalUnread = useMemo(
    () => Object.values(unreadByChannel).reduce((a, b) => a + b, 0),
    [unreadByChannel],
  );

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand + search */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <Megaphone className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-extrabold">منتدى الطلاب</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {connection === "connected" ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  متصل الآن
                </>
              ) : connection === "connecting" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-destructive" />
                  غير متصل
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent"
            aria-label="بحث"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileChannelsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent lg:hidden"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick access */}
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => setPinnedOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-sidebar-accent"
        >
          <Pin className="h-4 w-4 text-primary" />
          المثبتة
        </button>
        <button
          type="button"
          onClick={() => setBookmarksOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-sidebar-accent"
        >
          <Bookmark className="h-4 w-4 text-primary" />
          المفضلة
        </button>
      </div>

      {/* Channels */}
      <div className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
        {examBlocked && (
          <div className="mb-2 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            المنتدى مقفل أثناء أداء الامتحان.
          </div>
        )}

        {categoriesQuery.isLoading && (
          <div className="space-y-3 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-sidebar-accent/60" />
            ))}
          </div>
        )}

        {!categoriesQuery.isLoading &&
          (categoriesQuery.data ?? []).map((category) => {
            const channels = category.channels ?? [];
            if (channels.length === 0) return null;
            return (
              <div key={category.id} className="mb-4">
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {category.name}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {channels.map((channel) => {
                    const active = channel.id === activeChannelId;
                    const unread = unreadByChannel[channel.id] ?? 0;
                    return (
                      <ChannelRow
                        key={channel.id}
                        name={channel.name}
                        slug={channel.slug}
                        locked={channel.is_locked}
                        active={active}
                        unread={unread}
                        lastActivity={channel.last_message_at}
                        onSelect={() => {
                          useCommunityStore.getState().setActiveChannel(channel.id);
                          useCommunityStore.getState().clearUnread(channel.id);
                          setMobileChannelsOpen(false);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Announcements strip */}
      {(announcements.data?.length ?? 0) > 0 && (
        <div className="border-t px-3 py-2">
          <div className="text-[11px] font-bold text-muted-foreground">إعلانات</div>
          <div className="mt-1 max-h-24 space-y-1 overflow-y-auto">
            {announcements.data?.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-lg bg-sidebar-accent/60 px-2 py-1.5">
                <div className="truncate text-xs font-semibold">{a.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {a.channel?.name} · {formatRelativeTime(a.published_at ?? a.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer unread summary */}
      {totalUnread > 0 && (
        <div className="border-t px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground">
          {totalUnread} رسائل غير مقروءة
        </div>
      )}

      <BookmarksDialog open={bookmarksOpen} onOpenChange={setBookmarksOpen} />
      <PinnedDialog open={pinnedOpen} onOpenChange={setPinnedOpen} />
    </div>
  );
}

interface ChannelRowProps {
  name: string;
  slug: string;
  locked: boolean;
  active: boolean;
  unread: number;
  lastActivity: string | null;
  onSelect: () => void;
}

function ChannelRow({ name, slug, locked, active, unread, lastActivity, onSelect }: ChannelRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-colors",
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/60",
      )}
    >
      <ChannelIcon slug={slug} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{name}</span>
        {lastActivity && (
          <span className="block truncate text-[10px] text-muted-foreground">
            {formatRelativeTime(lastActivity)}
          </span>
        )}
      </span>
      {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />}
      <UnreadBadge count={unread} />
    </button>
  );
}
