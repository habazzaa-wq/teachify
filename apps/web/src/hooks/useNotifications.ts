"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/api/notification.service";
import type { NotificationItem } from "@/types/notification.types";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

/**
 * Live notification inbox for the current tenant user.
 * `typePrefix` lets consumers ask for one kind only (e.g. `session.`)
 * so unrelated notifications never reach the UI.
 */
export function useNotifications(typePrefix?: string, enabled = true) {
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "unread", typePrefix ?? "all"],
    queryFn: () => notificationService.listUnread(typePrefix),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const listQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "list", typePrefix ?? "all"],
    queryFn: () => notificationService.list(typePrefix),
    enabled,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
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
    refetch: () => {
      void unreadQuery.refetch();
      void listQuery.refetch();
    },
  };
}
