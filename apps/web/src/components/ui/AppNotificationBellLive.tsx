"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppNotificationMenu, type NotificationItem } from "./AppNotificationMenu";
import { useNotifications } from "@/hooks/useNotifications";

function formatTs(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return ts;
  }
}

export function AppNotificationBellLive({
  enabled = true,
  viewAllHref = "/dashboard/notifications",
}: {
  enabled?: boolean;
  viewAllHref?: string;
}) {
  const router = useRouter();
  const { unread, all, unreadCount, markRead } = useNotifications(enabled);

  const items: NotificationItem[] = useMemo(() => {
    const source = all.length ? all : unread;
    return source.slice(0, 8).map((n) => ({
      id: String(n.id),
      title: n.title || "إشعار",
      description: n.body || undefined,
      timestamp: formatTs(n.created_at),
      read: n.status !== "unread",
      initials: "إش",
    }));
  }, [all, unread]);

  return (
    <AppNotificationMenu
      notifications={items}
      unreadCount={unreadCount}
      onMarkAllRead={() => {
        unread.forEach((n) => markRead(n.id));
      }}
      onViewAll={() => router.push(viewAllHref)}
      onItemClick={(id) => {
        const num = Number(id);
        if (!Number.isNaN(num)) markRead(num);
      }}
    />
  );
}
