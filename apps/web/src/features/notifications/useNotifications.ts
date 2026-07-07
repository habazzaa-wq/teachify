"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/api/notification.service";
import { notificationPreferenceService } from "@/services/api/notification-preference.service";
import { notificationKeys } from "@/services/queryKeys";
import type { NotificationStatus } from "@/types/notification.types";
import type { UpdateNotificationPreferencesRequest } from "@/types/notification.types";

/** List notifications (optionally filtered to unread). */
export function useNotifications(status?: NotificationStatus | "unread") {
  return useQuery({
    queryKey: notificationKeys.list(status),
    queryFn: () => notificationService.list(),
    enabled: status !== "unread",
  });
}

/** List only unread notifications. */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.list("unread"),
    queryFn: () => notificationService.listUnread(),
  });
}

/** Mark a notification as read. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/** Archive a notification. */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/** Fetch the current member's notification preferences. */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationPreferenceService.list(),
  });
}

/** Update notification preferences. */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencesRequest) =>
      notificationPreferenceService.update(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(),
      });
    },
  });
}
