"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/api/notification.service";
import type { NotificationItem } from "@/types/notification.types";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

export function useNotifications(enabled = true) {
  const qc = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "unread"],
    queryFn: () => notificationService.listUnread(),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const listQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "list"],
    queryFn: () => notificationService.list(),
    enabled,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  const archive = useMutation({
    mutationFn: (id: number) => notificationService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  const unread = (unreadQuery.data?.notifications ?? []) as NotificationItem[];
  const all = (listQuery.data?.notifications ?? []) as NotificationItem[];

  return {
    unread,
    all,
    unreadCount: unread.length,
    isLoading: unreadQuery.isLoading,
    markRead: markRead.mutate,
    archive: archive.mutate,
    refetch: () => {
      unreadQuery.refetch();
      listQuery.refetch();
    },
  };
}
