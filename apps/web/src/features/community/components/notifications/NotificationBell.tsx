"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useArchiveNotification,
  useNotifications,
  useUnreadNotifications,
} from "../../hooks/useNotifications";
import { formatRelativeTime } from "../../utils/time";
import { MemberAvatar } from "../atoms";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: unread, markAllRead, markRead } = useUnreadNotifications();
  const notificationsQuery = useNotifications();
  const archiveMutation = useArchiveNotification();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const list = notificationsQuery.data?.notifications ?? [];

  const handleMarkAll = () => {
    markAllRead(list.filter((n) => !n.read_at).map((n) => n.id));
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {(unread ?? 0) > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {unread! > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-40 mt-2 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-2xl border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-extrabold">الإشعارات</span>
            {(unread ?? 0) > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notificationsQuery.isLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ التحميل…
              </div>
            )}
            {!notificationsQuery.isLoading && list.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-semibold">لا توجد إشعارات</p>
              </div>
            )}
            {list.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.read_at) markRead(notification.id);
                }}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-start transition-colors hover:bg-accent",
                  !notification.read_at && "bg-primary/[0.04]",
                )}
              >
                <MemberAvatar name={undefined} avatar={null} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">{notification.title}</span>
                  {notification.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {notification.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
                {!notification.read_at && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                <button
                  type="button"
                  aria-label="أرشفة"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveMutation.mutate(notification.id);
                  }}
                  className="self-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
