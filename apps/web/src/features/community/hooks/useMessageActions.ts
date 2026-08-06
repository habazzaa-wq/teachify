"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { communityApi, isExamBlockedError } from "../api/community.api";
import { communityKeys } from "../queryKeys";
import {
  insertDescSorted,
  removeMessageFromCache,
  replaceMessageInCache,
  upsertMessageInCache,
} from "./message-cache";
import { useCommunityStore } from "../stores/community.store";
import { useCurrentMember } from "./useCurrentMember";
import type {
  CommunityMessage,
  StoreMessagePayload,
} from "../types";

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { memberId, memberName, memberAvatar } = useCurrentMember();
  const setExamBlocked = useCommunityStore((s) => s.setExamBlocked);
  const clearUnread = useCommunityStore((s) => s.clearUnread);

  return useMutation({
    mutationFn: ({
      channelId,
      payload,
    }: {
      channelId: string;
      payload: StoreMessagePayload;
    }) => communityApi.storeMessage(channelId, payload),

    onMutate: async ({ channelId, payload }) => {
      await queryClient.cancelQueries({
        queryKey: ["community", "messages", channelId],
      });

      const tempId = payload.client_message_id ?? `temp-${Date.now()}`;
      const tempMessage: CommunityMessage = {
        id: tempId,
        channel_id: channelId,
        thread_id: payload.thread_id ?? null,
        parent_message_id: payload.parent_message_id ?? null,
        reply_to_message_id: payload.reply_to_message_id ?? null,
        author: {
          id: memberId,
          name: memberName,
          avatar: memberAvatar,
          role: null,
        },
        avatar: memberAvatar,
        role: null,
        body: payload.body,
        body_text: payload.body,
        content_type: payload.content_type ?? "text",
        status: "sending",
        edited: false,
        pinned: false,
        announcement: false,
        official_answer: false,
        accepted_answer: false,
        solved: false,
        highlighted: false,
        attachments: (payload.attachments ?? []).map((a, i) => ({
          id: `tmp-${Date.now()}-${i}`,
          type: a.type,
          file_name: a.file_name ?? null,
          mime_type: a.mime_type ?? null,
          size_bytes: a.size_bytes ?? null,
          duration_seconds: a.duration_seconds ?? null,
          url: a.url ?? null,
          media_asset_id: a.media_asset_id ?? null,
          metadata: a.metadata ?? null,
        })),
        reactions: [],
        reply_count: 0,
        thread_count: 0,
        metadata: { client_message_id: tempId },
        edited_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      upsertMessageInCache(queryClient, channelId, tempMessage);
      return { tempId, channelId, scope: payload.thread_id ?? "main" };
    },

    onSuccess: (serverMessage, { channelId }, context) => {
      if (!context) return;
      removeMessageFromCache(queryClient, channelId, context.tempId);
      upsertMessageInCache(queryClient, channelId, serverMessage);
      clearUnread(channelId);
      if (serverMessage.thread_id) {
        void queryClient.invalidateQueries({
          queryKey: communityKeys.thread(serverMessage.thread_id),
        });
      }
    },

    onError: (error, { channelId }, context) => {
      if (!context) return;
      removeMessageFromCache(queryClient, channelId, context.tempId);
      if (isExamBlockedError(error)) {
        setExamBlocked(true);
        return;
      }
      toast.error("تعذّر إرسال الرسالة. حاول مرة أخرى.");
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      body,
      content_type,
    }: {
      messageId: string;
      body: string;
      content_type?: string;
    }) => communityApi.updateMessage(messageId, body, content_type),

    onSuccess: (message) => {
      replaceMessageInCache(queryClient, message.channel_id, message);
    },

    onError: () => {
      toast.error("تعذّر تعديل الرسالة.");
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: CommunityMessage) => communityApi.deleteMessage(message.id),

    onMutate: (message) => {
      removeMessageFromCache(queryClient, message.channel_id, message.id);
    },

    onError: () => {
      toast.error("تعذّر حذف الرسالة.");
    },
  });
}

/** Reaction toggle with local optimistic update and rollback. */
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { memberId } = useCurrentMember();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => communityApi.toggleReaction(messageId, emoji),

    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({
        queryKey: ["community", "messages"],
      });
      const affected: Array<{ channelId: string; scope: string }> = [];
      const scopeKeys = queryClient
        .getQueryCache()
        .findAll({ queryKey: ["community", "messages"] });

      for (const q of scopeKeys) {
        const key = q.queryKey;
        const channelId = key[2] as string;
        const scope = key[3] as string;
        affected.push({ channelId, scope });
        queryClient.setQueryData(
          q.queryKey,
          (old: unknown) => {
            const pages = (old as { pages?: { data: CommunityMessage[] }[] })
              ?.pages;
            if (!pages) return old;
            return {
              ...(old as object),
              pages: pages.map((p) => ({
                ...p,
                data: p.data.map((m) =>
                  m.id === messageId
                    ? applyReactionOptimistic(m, emoji, memberId)
                    : m,
                ),
              })),
            };
          },
        );
      }

      return { affected, messageId };
    },

    onSuccess: (result, { messageId }) => {
      if (!result?.reaction) return;
      // Reconcile the optimistic toggle with the authoritative reaction row.
      queryClient.setQueriesData<{ pages?: { data: CommunityMessage[] }[] }>(
        { queryKey: ["community", "messages"] },
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.map((m) =>
                m.id === messageId
                  ? reconcileReaction(m, result.action, result.reaction)
                  : m,
              ),
            })),
          };
        },
      );
    },

    onError: (_error, _vars, context) => {
      toast.error("تعذّر تحديث التفاعل.");
      context?.affected.forEach(({ channelId, scope }) => {
        void queryClient.invalidateQueries({
          queryKey: communityKeys.messages(channelId, scope),
        });
      });
    },
  });
}

function reconcileReaction(
  message: CommunityMessage,
  action: "added" | "removed",
  serverReaction: { emoji: string; count: number; members: unknown[] } | null,
): CommunityMessage {
  if (!serverReaction) return message;
  const reactions = message.reactions ?? [];
  const others = reactions.filter((r) => r.emoji !== serverReaction.emoji);
  const members = Array.isArray(serverReaction.members)
    ? serverReaction.members.map((m) => {
        const mm = (m ?? {}) as Record<string, unknown>;
        return {
          id: mm.id != null ? String(mm.id) : null,
          name: (mm.name as string) ?? null,
          avatar: (mm.avatar as string) ?? null,
        };
      })
    : [];
  const next =
    action === "removed" || serverReaction.count <= 0
      ? others
      : [
          ...others,
          {
            emoji: serverReaction.emoji,
            count: serverReaction.count,
            members,
          },
        ];
  return { ...message, reactions: next };
}

function applyReactionOptimistic(
  message: CommunityMessage,
  emoji: string,
  memberId: string | null,
): CommunityMessage {
  const reactions = message.reactions ?? [];
  const existing = reactions.find((r) => r.emoji === emoji);
  const mine = memberId
    ? existing?.members.some((m) => m.id === memberId)
    : false;

  let next: typeof reactions;
  if (!existing) {
    next = [
      ...reactions,
      {
        emoji,
        count: 1,
        members: memberId ? [{ id: memberId, name: null, avatar: null }] : [],
      },
    ];
  } else if (mine) {
    next = reactions
      .map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              count: Math.max(0, r.count - 1),
              members: memberId
                ? r.members.filter((m) => m.id !== memberId)
                : r.members,
            }
          : r,
      )
      .filter((r) => r.count > 0);
  } else {
    next = reactions.map((r) =>
      r.emoji === emoji
        ? {
            ...r,
            count: r.count + 1,
            members: memberId
              ? [...r.members, { id: memberId, name: null, avatar: null }]
              : r.members,
          }
        : r,
    );
  }

  return { ...message, reactions: next };
}

/** Simple message-flag mutation factory (pin/solve/accept/official/highlight). */
function useFlagMutation(
  fn: (messageId: string, value: boolean) => Promise<CommunityMessage>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      value,
    }: {
      messageId: string;
      value: boolean;
    }) => fn(messageId, value),

    onSuccess: (message) => {
      replaceMessageInCache(queryClient, message.channel_id, message);
    },

    onError: () => {
      toast.error("تعذّر تحديث الرسالة.");
      void queryClient.invalidateQueries({
        queryKey: ["community", "messages"],
      });
    },
  });
}

export function usePinMessage() {
  return useFlagMutation((id, v) => communityApi.pinMessage(id, v));
}

export function useSolveMessage() {
  return useFlagMutation((id, v) => communityApi.solveMessage(id, v));
}

export function useAcceptMessage() {
  return useFlagMutation((id, v) => communityApi.acceptMessage(id, v));
}

export function useOfficialMessage() {
  return useFlagMutation((id, v) => communityApi.officialMessage(id, v));
}

export function useHighlightMessage() {
  return useFlagMutation((id, v) => communityApi.highlightMessage(id, v));
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const clearUnread = useCommunityStore((s) => s.clearUnread);

  const mutation = useMutation({
    mutationFn: ({
      channelId,
      messageId,
      threadId,
    }: {
      channelId: string;
      messageId: string;
      threadId?: string | null;
    }) => communityApi.markRead(channelId, messageId, threadId),
    onError: () => {
      // Read receipts are best-effort; silently ignore failures.
    },
  });

  const markRead = useCallback(
    ({
      channelId,
      messageId,
      threadId,
    }: {
      channelId: string;
      messageId: string;
      threadId?: string | null;
    }) => {
      clearUnread(channelId);
      void queryClient.invalidateQueries({
        queryKey: communityKeys.channel(channelId),
      });
      mutation.mutate({ channelId, messageId, threadId });
    },
    [clearUnread, mutation.mutate, queryClient],
  );

  return { markRead, ...mutation };
}

/** Bookmark / unbookmark a message. */
export function useBookmarkMessage() {
  const queryClient = useQueryClient();
  const { memberId } = useCurrentMember();

  return useMutation({
    mutationFn: ({
      message,
      bookmark,
      note,
    }: {
      message: CommunityMessage;
      bookmark: boolean;
      note?: string | null;
    }) =>
      bookmark
        ? communityApi.bookmarkMessage(message.id, note)
        : communityApi.unbookmarkMessage(message.id),

    onMutate: ({ message, bookmark }) => {
      const isMine = message.author?.id === memberId;
      const patch: Partial<CommunityMessage> = {
        ...(isMine ? { metadata: { ...(message.metadata ?? {}), bookmarked: bookmark } } : {}),
      };
      if (isMine) {
        queryClient.setQueriesData<{ pages?: { data: CommunityMessage[] }[] }>(
          { queryKey: ["community", "messages"] },
          (old) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                data: p.data.map((m) => (m.id === message.id ? { ...m, ...patch } : m)),
              })),
            };
          },
        );
      }
      void queryClient.invalidateQueries({ queryKey: communityKeys.bookmarks() });
    },

    onError: () => {
      toast.error("تعذّر تحديث المفضلة.");
    },
  });
}

/** Keep a stable insertion helper import (used by realtime too). */
export { insertDescSorted };
