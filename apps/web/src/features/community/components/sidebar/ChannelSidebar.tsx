"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  Loader2,
  Lock,
  Megaphone,
  Pin,
  Search,
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
  const [query, setQuery] = useState("");

  const totalUnread = useMemo(
    () => Object.values(unreadByChannel).reduce((a, b) => a + b, 0),
    [unreadByChannel],
  );

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categoriesQuery.data ?? [];
    return (categoriesQuery.data ?? [])
      .map((category) => ({
        ...category,
        channels: (category.channels ?? []).filter((channel) =>
          channel.name.toLowerCase().includes(q),
        ),
      }))
      .filter((category) => (category.channels ?? []).length > 0);
  }, [categoriesQuery.data, query]);

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand + connection */}
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30">
            <Megaphone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold leading-tight">منتدى الطلاب</div>
            <div className="flex items-center gap-1 text-[10px] text-sidebar-fg-muted">
              {connection === "connected" ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  متصل الآن
                </>
              ) : connection === "connecting" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  جارٍ الاتصال…
                </>
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-fg-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="بحث في المنتدى"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileChannelsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-fg-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Channel filter */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto h-4 w-4 text-sidebar-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="ابحث عن قناة…"
            className="w-full rounded-xl border border-sidebar-border bg-sidebar-soft py-2 ps-8 pe-3 text-sm text-sidebar-foreground placeholder:text-sidebar-fg-subtle outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Quick access */}
      <div className="flex gap-1.5 px-3 pt-3">
        <button
          type="button"
          onClick={() => setPinnedOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sidebar-border bg-sidebar-soft px-2.5 py-2 text-xs font-bold transition-colors hover:border-primary/40 hover:bg-sidebar-accent"
        >
          <Pin className="h-3.5 w-3.5 text-primary" />
          المثبتة
        </button>
        <button
          type="button"
          onClick={() => setBookmarksOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sidebar-border bg-sidebar-soft px-2.5 py-2 text-xs font-bold transition-colors hover:border-primary/40 hover:bg-sidebar-accent"
        >
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          المفضلة
        </button>
      </div>

      {/* Channels */}
      <div className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
        {examBlocked && (
          <div className="mb-2 mx-1 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
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

        {!categoriesQuery.isLoading && filteredCategories.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-sidebar-fg-muted">
            لا توجد قنوات مطابقة لـ «{query}»
          </p>
        )}

        {!categoriesQuery.isLoading &&
          filteredCategories.map((category) => {
            const channels = category.channels ?? [];
            if (channels.length === 0) return null;
            return (
              <div key={category.id} className="mb-3">
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-sidebar-fg-muted">
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
        "group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start transition-colors",
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      {active && (
        <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />
      )}
      <ChannelIcon slug={slug} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{name}</span>
        {lastActivity && (
          <span className="block truncate text-[10px] text-sidebar-fg-subtle">
            {formatRelativeTime(lastActivity)}
          </span>
        )}
      </span>
      {locked && <Lock className="h-3.5 w-3.5 text-sidebar-fg-subtle" />}
      <UnreadBadge count={unread} />
    </button>
  );
}
