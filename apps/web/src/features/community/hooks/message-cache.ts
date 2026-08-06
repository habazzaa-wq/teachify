"use client";

import type { QueryClient } from "@tanstack/react-query";
import { communityKeys } from "../queryKeys";
import type {
  CommunityMessage,
  CommunityMessagesResponse,
  PaginationMeta,
} from "../types";

export type MessagesPage = {
  data: CommunityMessage[];
  meta?: PaginationMeta;
};

export const MESSAGES_PER_PAGE = 50;

type MessagesCacheData = {
  pages: MessagesPage[];
  pageParams: unknown[];
};

/** Read the infinite-query cache for a channel scope, if present. */
export function getMessagesCache(
  queryClient: QueryClient,
  channelId: string,
  scope: string,
): MessagesPage[] | null {
  const state = queryClient.getQueryState<MessagesCacheData>(
    communityKeys.messages(channelId, scope),
  );
  return state?.data?.pages ?? null;
}

/** Flatten pages into a single newest-first array. */
export function flattenPages(pages: MessagesPage[] | null): CommunityMessage[] {
  return pages?.flatMap((p) => p.data) ?? [];
}

/** Compare two message ids numerically (ids are numeric strings). */
export function byIdDesc(a: CommunityMessage, b: CommunityMessage): number {
  return Number(b.id) - Number(a.id);
}

/** Insert a message maintaining newest-first (descending id) order. */
export function insertDescSorted(
  list: CommunityMessage[],
  message: CommunityMessage,
): CommunityMessage[] {
  const idx = list.findIndex((m) => m.id === message.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = message;
    return next;
  }
  const insertAt = list.findIndex((m) => byIdDesc(m, message) > 0);
  if (insertAt < 0) return [...list, message];
  const next = [...list];
  next.splice(insertAt, 0, message);
  return next;
}

/** Upsert (insert or replace) a message into every matching cache scope. */
export function upsertMessageInCache(
  queryClient: QueryClient,
  channelId: string,
  message: CommunityMessage,
): void {
  const scopes = new Set<string>([
    "main",
    ...(message.thread_id ? [message.thread_id] : []),
  ]);
  for (const scope of scopes) {
    const pages = getMessagesCache(queryClient, channelId, scope);
    if (!pages) continue;
    const firstPage = { ...pages[0]!, data: insertDescSorted(pages[0]!.data, message) };
    queryClient.setQueryData<MessagesCacheData>(
      communityKeys.messages(channelId, scope),
      (old) =>
        old
          ? {
              ...old,
              pages: [firstPage, ...pages.slice(1)],
            }
          : old,
    );
  }
}

/** Replace an existing message in place (update case). */
export function replaceMessageInCache(
  queryClient: QueryClient,
  channelId: string,
  message: CommunityMessage,
): void {
  const scopes = new Set<string>([
    "main",
    ...(message.thread_id ? [message.thread_id] : []),
  ]);
  for (const scope of scopes) {
    const pages = getMessagesCache(queryClient, channelId, scope);
    if (!pages) continue;
    queryClient.setQueryData<MessagesCacheData>(
      communityKeys.messages(channelId, scope),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            data: p.data.map((m) => (m.id === message.id ? message : m)),
          })),
        };
      },
    );
  }
}

/** Remove a message from every cache scope it could live in. */
export function removeMessageFromCache(
  queryClient: QueryClient,
  channelId: string,
  messageId: string,
): void {
  for (const scope of ["main"]) {
    const pages = getMessagesCache(queryClient, channelId, scope);
    if (!pages) continue;
    queryClient.setQueryData<MessagesCacheData>(
      communityKeys.messages(channelId, scope),
      (old) => {
        if (!old) return old;
        const next = old.pages
          .map((p) => ({
            ...p,
            data: p.data.filter((m) => m.id !== messageId),
          }))
          .filter((p) => p.data.length > 0);
        return next.length ? { ...old, pages: next } : old;
      },
    );
  }
  queryClient.setQueriesData<MessagesCacheData>(
    { queryKey: ["community", "messages", channelId] },
    (old) => {
      if (!old) return old;
      const next = old.pages
        .map((p) => ({
          ...p,
          data: p.data.filter((m) => m.id !== messageId),
        }))
        .filter((p) => p.data.length > 0);
      return next.length ? { ...old, pages: next } : old;
    },
  );
}

/**
 * Normalize the snake_case broadcast payload (from Laravel events) into the
 * camelCase `CommunityMessage` resource shape used everywhere else.
 */
export function normalizeBroadcastMessage(
  raw: Record<string, unknown>,
): CommunityMessage | null {
  const id = String(raw.id ?? "");
  if (!id) return null;

  const authorRaw = (raw.author ?? {}) as Record<string, unknown>;
  const author = {
    id: authorRaw.id != null ? String(authorRaw.id) : null,
    name: (authorRaw.name as string) ?? null,
    avatar: (authorRaw.avatar as string) ?? null,
    role: (authorRaw.role as CommunityMessage["role"]) ?? null,
  };

  return {
    id,
    channel_id: String(raw.channel_id ?? ""),
    thread_id: raw.thread_id != null ? String(raw.thread_id) : null,
    parent_message_id:
      raw.parent_message_id != null ? String(raw.parent_message_id) : null,
    reply_to_message_id:
      raw.reply_to_message_id != null ? String(raw.reply_to_message_id) : null,
    author,
    avatar: (raw.avatar as string) ?? author.avatar,
    role: author.role,
    body: String(raw.body ?? ""),
    body_text: (raw.body_text as string) ?? null,
    content_type: (raw.content_type as CommunityMessage["content_type"]) ?? "text",
    status: String(raw.status ?? "active"),
    edited: Boolean(raw.edited ?? (raw.edited_at != null)),
    pinned: Boolean(raw.is_pinned ?? raw.pinned),
    announcement: Boolean(raw.is_announcement ?? raw.announcement),
    official_answer: Boolean(raw.is_official_answer ?? raw.official_answer),
    accepted_answer: Boolean(raw.is_official_answer ?? raw.accepted_answer),
    solved: Boolean(raw.is_solved ?? raw.solved),
    highlighted: Boolean(raw.is_highlighted ?? raw.highlighted),
    attachments: normalizeAttachments(raw.attachments),
    reactions: normalizeReactions(raw.reactions),
    reply_count: Number(raw.reply_count ?? 0),
    thread_count: Number(raw.thread_count ?? 0),
    metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
    edited_at: (raw.edited_at as string) ?? null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  };
}

function normalizeAttachments(
  raw: unknown,
): CommunityMessage["attachments"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const a = (item ?? {}) as Record<string, unknown>;
    return {
      id: a.id != null ? String(a.id) : crypto.randomUUID?.() ?? `${Date.now()}`,
      type: String(a.type ?? "file"),
      file_name: (a.file_name as string) ?? null,
      mime_type: (a.mime_type as string) ?? null,
      size_bytes: a.size_bytes != null ? Number(a.size_bytes) : null,
      duration_seconds:
        a.duration_seconds != null ? Number(a.duration_seconds) : null,
      url: (a.url as string) ?? null,
      media_asset_id: a.media_asset_id != null ? String(a.media_asset_id) : null,
      metadata: (a.metadata as Record<string, unknown> | null) ?? null,
    };
  });
}

function normalizeReactions(
  raw: unknown,
): CommunityMessage["reactions"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const members = Array.isArray(r.members)
      ? r.members.map((m) => {
          const mm = (m ?? {}) as Record<string, unknown>;
          return {
            id: mm.id != null ? String(mm.id) : null,
            name: (mm.name as string) ?? null,
            avatar: (mm.avatar as string) ?? null,
          };
        })
      : [];
    return {
      emoji: String(r.emoji ?? ""),
      count: Number(r.count ?? members.length),
      members,
    };
  });
}

/** Type guard for the message list response array. */
export function isMessagesResponseShape(
  value: unknown,
): value is CommunityMessagesResponse["messages"] {
  return Array.isArray(value);
}
