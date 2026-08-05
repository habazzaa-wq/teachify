"use client";

import { useCallback, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import { communityKeys } from "../queryKeys";

export function useNotifications() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...communityKeys.notifications.list(), page],
    queryFn: () => communityApi.notifications({ page, per_page: 20 }),
    staleTime: 30_000,
  });

  return { ...query, page, setPage };
}

export function useUnreadNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: communityKeys.notifications.unread(),
    queryFn: communityApi.unreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markAllRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      void Promise.all(ids.map((id) => communityApi.markNotificationRead(id)))
        .then(() => queryClient.setQueryData(communityKeys.notifications.unread(), 0))
        .catch(() => {
          // ignore
        });
    },
    [queryClient],
  );

  const markRead = useCallback(
    (id: string) => {
      void communityApi.markNotificationRead(id).catch(() => {
        // ignore
      });
    },
    [],
  );

  return { ...query, markAllRead, markRead };
}

export function useArchiveNotification() {
  return useMutation({
    mutationFn: (id: string) => communityApi.archiveNotification(id),
  });
}
