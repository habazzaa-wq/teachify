"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationChannelName,
  getCommunityEcho,
} from "@/features/community/api/echo";
import { isInstructorWorkspace } from "@/features/instructors/workspace";
import { useInstructorAuthStore } from "@/features/instructors/store";
import { notificationService } from "@/services/api/notification.service";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type {
  NotificationItem,
  NotificationListResponse,
} from "@/types/notification.types";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

type InboxListener = (notification: NotificationItem) => void;

/** One Echo subscription per member channel, shared by every bell on the page. */
const channelListeners = new Map<string, Set<InboxListener>>();

function subscribeToInbox(
  channelName: string,
  listener: InboxListener,
  subscriptionKey: string,
): () => void {
  let listeners = channelListeners.get(subscriptionKey);

  if (!listeners) {
    listeners = new Set<InboxListener>();
    channelListeners.set(subscriptionKey, listeners);

    getCommunityEcho()
      ?.private(channelName)
      .listen(".notification.created", (payload: unknown) => {
        const notification = (payload as { notification?: NotificationItem })?.notification;
        if (!notification?.id) return;
        channelListeners.get(channelName)?.forEach((callback) => callback(notification));
      });
  }

  listeners.add(listener);

  return () => {
    const current = channelListeners.get(subscriptionKey);
    current?.delete(listener);
    if (current && current.size === 0) {
      channelListeners.delete(subscriptionKey);
      try {
        getCommunityEcho()?.leaveChannel(channelName);
      } catch {
        // ignore
      }
    }
  };
}

/**
 * Live notification inbox for the current tenant user.
 *
 * Both call styles are supported so older bells keep working:
 *   useNotifications(enabled)
 *   useNotifications(typePrefix, enabled)
 *
 * `typePrefix` lets consumers ask for one kind only (e.g. `session.`)
 * so unrelated notifications never reach the UI.
 */
export function useNotifications(
  typePrefixOrEnabled?: string | boolean,
  enabledArg = true,
) {
  const typePrefix =
    typeof typePrefixOrEnabled === "string" ? typePrefixOrEnabled : undefined;
  const enabled =
    typeof typePrefixOrEnabled === "boolean" ? typePrefixOrEnabled : enabledArg;
  const queryClient = useQueryClient();

  const isInstructor = isInstructorWorkspace();
  const tenantId = useTenantStore((state) => state.activeTenant?.id);
  const membershipId = useTenantStore((state) => state.membership?.id);
  const instructorTenantId = useInstructorAuthStore(
    (state) => state.membership?.tenant_id,
  );
  const instructorMembershipId = useInstructorAuthStore(
    (state) => state.membership?.id,
  );
  // Re-subscribe when credentials change (login, tenant switch).
  const authToken = useAuthStore((state) => state.accessToken);
  const instructorToken = useInstructorAuthStore((state) => state.accessToken);

  const resolvedTenantId = isInstructor ? instructorTenantId : tenantId;
  const resolvedMembershipId = isInstructor ? instructorMembershipId : membershipId;

  const unreadQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "unread", typePrefix ?? "all"],
    queryFn: () => notificationService.listUnread(typePrefix),
    enabled,
    // Fallback when the Reverb server is not running (local/dev setups).
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const listQuery = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "list", typePrefix ?? "all"],
    queryFn: () => notificationService.list(typePrefix),
    enabled,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const handleRealtimeNotification = useCallback(
    (notification: NotificationItem) => {
      const cached = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });

      for (const [key, current] of cached) {
        if (!current || !Array.isArray(current.notifications)) continue;

        const bucket = key[1];
        const keyPrefix = typeof key[2] === "string" ? key[2] : "all";
        if (bucket !== "unread" && bucket !== "list") continue;
        if (keyPrefix !== "all" && !notification.type.startsWith(keyPrefix)) {
          continue;
        }
        if (bucket === "unread" && notification.status !== "unread") {
          continue;
        }
        if (current.notifications.some((item) => item.id === notification.id)) {
          continue;
        }

        queryClient.setQueryData<NotificationListResponse>(key, {
          ...current,
          notifications: [notification, ...current.notifications].slice(0, 25),
        });
      }

      // Re-fetch so counts and ordering always match the server.
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
    [queryClient],
  );

  useEffect(() => {
    if (
      !enabled ||
      resolvedTenantId == null ||
      resolvedMembershipId == null ||
      (isInstructor ? !instructorToken : !authToken)
    ) {
      return;
    }

    const channelName = notificationChannelName(
      String(resolvedTenantId),
      String(resolvedMembershipId),
    );
    // Re-subscribe with a fresh Echo client whenever the credentials change.
    const subscriptionKey = `${isInstructor ? "instructor" : "student"}:${
      isInstructor ? instructorToken : authToken
    }:${channelName}`;

    return subscribeToInbox(channelName, handleRealtimeNotification, subscriptionKey);
  }, [
    enabled,
    resolvedTenantId,
    resolvedMembershipId,
    isInstructor,
    authToken,
    instructorToken,
    handleRealtimeNotification,
  ]);

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  const archive = useMutation({
    mutationFn: (id: number) => notificationService.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  const unread = (unreadQuery.data?.notifications ?? []) as NotificationItem[];
  const all = (listQuery.data?.notifications ?? []) as NotificationItem[];

  const refetch = useMemo(
    () => () => {
      void unreadQuery.refetch();
      void listQuery.refetch();
    },
    [unreadQuery, listQuery],
  );

  return {
    unread,
    all,
    unreadCount: unread.length,
    isLoading: unreadQuery.isLoading,
    markRead: markRead.mutate,
    archive: archive.mutate,
    refetch,
  };
}
