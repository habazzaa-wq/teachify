"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  communityChannelName,
  communityPresenceChannelName,
  communityTenantChannelName,
  communityThreadChannelName,
  getCommunityEcho,
} from "../api/echo";
import { communityKeys } from "../queryKeys";
import {
  normalizeBroadcastMessage,
  removeMessageFromCache,
  replaceMessageInCache,
  upsertMessageInCache,
} from "./message-cache";
import { useCommunityStore } from "../stores/community.store";
import { useCurrentMember } from "./useCurrentMember";
import type { CommunityMessage } from "../types";

interface RealtimeOptions {
  enabled: boolean;
  tenantId: string | null;
  channelIds: string[];
  activeChannelId: string | null;
  activeThreadId: string | null;
}

const TYPING_VISIBLE_MS = 5_000;

/**
 * Wires the Echo socket to the community cache:
 * - message.created / updated / deleted / pinned
 * - message.reaction
 * - typing.started
 * - presence.updated
 * - announcement.published
 */
export function useCommunityRealtime({
  enabled,
  tenantId,
  channelIds,
  activeChannelId,
  activeThreadId,
}: RealtimeOptions) {
  const queryClient = useQueryClient();
  const { memberId } = useCurrentMember();

  const setConnection = useCommunityStore((s) => s.setConnection);
  const incrementUnread = useCommunityStore((s) => s.incrementUnread);
  const upsertTyping = useCommunityStore((s) => s.upsertTyping);
  const clearTyping = useCommunityStore((s) => s.clearTyping);
  const setOnlineMemberIds = useCommunityStore((s) => s.setOnlineMemberIds);

  const activeRef = useRef({ activeChannelId, activeThreadId });
  useEffect(() => {
    activeRef.current = { activeChannelId, activeThreadId };
  }, [activeChannelId, activeThreadId]);

  const handleMessageEvent = useCallback(
    (eventName: string, raw: { message?: Record<string, unknown>; messageId?: string }) => {
      if (!raw.message) return;
      const message = normalizeBroadcastMessage(raw.message);
      if (!message) return;

      const { activeChannelId: activeChannel, activeThreadId: activeThread } =
        activeRef.current;

      if (eventName === "message.deleted") {
        removeMessageFromCache(queryClient, message.channel_id, message.id);
        return;
      }

      if (eventName === "message.updated" || eventName === "message.pinned") {
        replaceMessageInCache(queryClient, message.channel_id, message);
        return;
      }

      // message.created
      upsertMessageInCache(queryClient, message.channel_id, message);

      const isOwn = message.author?.id === memberId;
      const inActiveChannel = message.channel_id === activeChannel;
      const threadMatches =
        (message.thread_id ?? null) === (activeThread ?? null);

      if (inActiveChannel && threadMatches) {
        // Best-effort read receipt so others see the active user as "seen".
        if (!isOwn) {
          void import("../api/community.api").then(({ communityApi }) => {
            void communityApi.markRead(
              message.channel_id,
              message.id,
              message.thread_id,
            );
          });
        }
      } else if (!isOwn) {
        incrementUnread(message.channel_id);
      }
    },
    [queryClient, memberId, incrementUnread],
  );

  const handleReactionEvent = useCallback(
    (
      raw: {
        reaction?: Record<string, unknown>;
        action?: "added" | "removed";
        messageId?: string | number;
      },
    ) => {
      const messageId = raw.messageId != null ? String(raw.messageId) : null;
      if (!messageId || !raw.reaction || !raw.action) return;

      queryClient.setQueriesData<{ pages?: { data: CommunityMessage[] }[] }>(
        { queryKey: ["community", "messages"] },
        (old) => {
          if (!old?.pages) return old;
          const emoji = String(raw.reaction!.emoji ?? "");
          const count = Number(raw.reaction!.count ?? 0);
          const rawMembers = Array.isArray(raw.reaction!.members)
            ? raw.reaction!.members
            : [];
          const members = rawMembers.map((m) => {
            const mm = (m ?? {}) as Record<string, unknown>;
            return {
              id: mm.id != null ? String(mm.id) : null,
              name: (mm.name as string) ?? null,
              avatar: (mm.avatar as string) ?? null,
            };
          });
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.map((m) => {
                if (m.id !== messageId) return m;
                const others = m.reactions.filter((r) => r.emoji !== emoji);
                const next =
                  raw.action === "removed" || count <= 0
                    ? others
                    : [
                        ...others,
                        { emoji, count, members },
                      ];
                return { ...m, reactions: next };
              }),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const handleTypingEvent = useCallback(
    (
      raw: {
        user?: { id?: string | number; name?: string; avatar?: string | null };
        channelId?: string | number;
        threadId?: string | number | null;
      },
    ) => {
      const channelId = raw.channelId != null ? String(raw.channelId) : null;
      const user = raw.user;
      if (!channelId || !user?.id) return;
      const memberIdValue = String(user.id);
      upsertTyping(channelId, {
        memberId: memberIdValue,
        name: user.name ?? "",
        avatar: user.avatar ?? null,
        at: Date.now(),
      });
      window.setTimeout(
        () => clearTyping(channelId, memberIdValue),
        TYPING_VISIBLE_MS,
      );
    },
    [upsertTyping, clearTyping],
  );

  useEffect(() => {
    if (!enabled || !tenantId) return;
    const echo = getCommunityEcho();
    if (!echo) return;

    setConnection("connecting");

    const cleanups: Array<() => void> = [];

    // Connection lifecycle (Pusher protocol connection events via connector).
    const onConnect = () => setConnection("connected");
    const onError = () => setConnection("disconnected");
    const pusher = echo.connector?.pusher as
      | { connection?: { bind?: (event: string, cb: () => void) => void; unbind?: (event: string, cb: () => void) => void } }
      | undefined;
    const connection = pusher?.connection;
    if (connection?.bind) {
      connection.bind("connected", onConnect);
      connection.bind("error", onError);
      connection.bind("disconnected", onError);
      cleanups.push(() => {
        connection.unbind?.("connected", onConnect);
        connection.unbind?.("error", onError);
        connection.unbind?.("disconnected", onError);
      });
    }

    // Channel-scoped subscriptions (messages, reactions, typing).
    const channelSubs = channelIds.map((channelId) => {
      const channel = echo.private(
        communityChannelName(tenantId, channelId),
      );
      channel
        .subscribed(() => {
          setConnection("connected");
        })
        .error(() => {
          setConnection("connected");
        })
        .listen(".message.created", (e: unknown) =>
          handleMessageEvent("message.created", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.updated", (e: unknown) =>
          handleMessageEvent("message.updated", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.deleted", (e: unknown) =>
          handleMessageEvent("message.deleted", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.pinned", (e: unknown) =>
          handleMessageEvent("message.pinned", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.reaction", (e: unknown) =>
          handleReactionEvent(e as { reaction?: Record<string, unknown>; action?: "added" | "removed"; messageId?: string | number }),
        )
        .listen(".typing.started", (e: unknown) =>
          handleTypingEvent(e as { user?: { id?: string | number; name?: string; avatar?: string | null }; channelId?: string | number; threadId?: string | number | null }),
        );
      return () => {
        try {
          echo.leaveChannel(communityChannelName(tenantId, channelId));
        } catch {
          // ignore
        }
      };
    });
    cleanups.push(...channelSubs);

    // Thread-scoped subscription for the active thread.
    if (activeThreadId) {
      const threadName = communityThreadChannelName(tenantId, activeThreadId);
      const thread = echo.private(threadName);
      thread
        .error(() => undefined)
        .listen(".message.created", (e: unknown) =>
          handleMessageEvent("message.created", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.updated", (e: unknown) =>
          handleMessageEvent("message.updated", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.deleted", (e: unknown) =>
          handleMessageEvent("message.deleted", e as { message?: Record<string, unknown> }),
        )
        .listen(".message.reaction", (e: unknown) =>
          handleReactionEvent(e as { reaction?: Record<string, unknown>; action?: "added" | "removed"; messageId?: string | number }),
        )
        .listen(".typing.started", (e: unknown) =>
          handleTypingEvent(e as { user?: { id?: string | number; name?: string; avatar?: string | null }; channelId?: string | number; threadId?: string | number | null }),
        );
      cleanups.push(() => {
        try {
          echo.leaveChannel(threadName);
        } catch {
          // ignore
        }
      });
    }

    // Tenant-wide subscription (announcements).
    const tenantChannel = echo.private(communityTenantChannelName(tenantId));
    tenantChannel
      .error(() => undefined)
      .listen(".announcement.published", (e: unknown) => {
        const raw = e as {
          message?: Record<string, unknown>;
          channelId?: string | number;
        };
        if (raw.message) {
          const message = normalizeBroadcastMessage(raw.message);
          if (message) {
            upsertMessageInCache(queryClient, message.channel_id, message);
            incrementUnread(message.channel_id);
          }
        }
        void queryClient.invalidateQueries({
          queryKey: communityKeys.announcements(),
        });
      });
    cleanups.push(() => {
      try {
        echo.leaveChannel(communityTenantChannelName(tenantId));
      } catch {
        // ignore
      }
    });

    // Presence roster (best effort — the REST poller is the source of truth).
    const presenceName = communityPresenceChannelName(tenantId);
    try {
      const presence = echo.join(presenceName);
      presence
        .error(() => undefined)
        .here((members: unknown) => {
          const ids = toPresenceIds(members);
          setOnlineMemberIds(ids);
          setConnection("connected");
        })
        .joining((member: unknown) => {
          const id = presenceIdOf(member);
          if (id) setOnlineMemberIds((prev) => Array.from(new Set([...prev, id])));
        })
        .leaving((member: unknown) => {
          const id = presenceIdOf(member);
          if (id) setOnlineMemberIds((prev) => prev.filter((m) => m !== id));
        })
        .listen(".presence.updated", (e: unknown) => {
          const raw = e as {
            user?: { id?: string | number };
            status?: string;
          };
          const id = raw.user?.id != null ? String(raw.user.id) : null;
          if (!id) return;
          if (raw.status === "offline") {
            setOnlineMemberIds((prev) => prev.filter((m) => m !== id));
          } else {
            setOnlineMemberIds((prev) => Array.from(new Set([...prev, id])));
          }
        });
      cleanups.push(() => {
        try {
          echo.leaveChannel(presenceName);
        } catch {
          // ignore
        }
      });
    } catch {
      // Presence channel is optional.
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [
    enabled,
    tenantId,
    channelIds,
    activeThreadId,
    queryClient,
    handleMessageEvent,
    handleReactionEvent,
    handleTypingEvent,
    setConnection,
    setOnlineMemberIds,
    incrementUnread,
  ]);
}

function toPresenceIds(members: unknown): string[] {
  if (!Array.isArray(members)) return [];
  return members
    .map((m) => presenceIdOf(m))
    .filter((id): id is string => Boolean(id));
}

function presenceIdOf(member: unknown): string | null {
  if (!member || typeof member !== "object") return null;
  const raw = member as Record<string, unknown>;
  const id = raw.id ?? raw.member_id ?? raw.tenant_user_id;
  return id != null ? String(id) : null;
}
