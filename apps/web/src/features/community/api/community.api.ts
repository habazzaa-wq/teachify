import api from "@/services/api/axios";
import type { ApiError } from "@/types/common.types";
import type {
  CommunityAnnouncement,
  CommunityAnnouncementsResponse,
  CommunityBookmark,
  CommunityBookmarksResponse,
  CommunityCategoriesResponse,
  CommunityCategory,
  CommunityChannel,
  CommunityChannelResponse,
  CommunityGamification,
  CommunityGamificationMeResponse,
  CommunityLeaderboardResponse,
  CommunityMessage,
  CommunityMessageResponse,
  CommunityMessagesResponse,
  CommunityNotification,
  CommunityNotificationsResponse,
  CommunityOnlineMembersResponse,
  CommunityPresence,
  CommunityPresenceResponse,
  CommunityReactionResponse,
  CommunitySearchResponse,
  CommunitySeenByResponse,
  CommunityStat,
  CommunityStatsResponse,
  CommunityThread,
  CommunityThreadResponse,
  CommunityThreadsResponse,
  CommunityUnreadNotificationsResponse,
  StoreMessagePayload,
} from "../types";

const EXAM_GATE_FIELD = "community";
const EXAM_GATE_MESSAGE = "لا يمكنك دخول المنتدى أثناء أداء الامتحان.";

/** True when a failed community call is caused by the exam protection gate. */
export function isExamBlockedError(error: unknown): boolean {
  const apiError = error as ApiError | null;
  const field = apiError?.fieldErrors?.[EXAM_GATE_FIELD];
  const message = apiError?.message ?? "";
  return (
    (Array.isArray(field) && field.some((f) => f.includes("الامتحان"))) ||
    message.includes(EXAM_GATE_MESSAGE)
  );
}

/** TEMP: forward a client-side error to the server log for diagnosis. */
export async function reportClientError(
  context: string,
  error: unknown,
): Promise<void> {
  try {
    const apiError = error as ApiError | null;
    await api.post("/debug/client-error", {
      context,
      message:
        apiError?.message ??
        (error instanceof Error ? error.message : String(error)),
      status: apiError?.status ?? null,
      fieldErrors: apiError?.fieldErrors ?? null,
      raw: apiError?.raw ?? null,
    });
  } catch {
    // Best-effort; never let diagnostics break the app.
  }
}

const unwrap = <T>(
  collection: T[] | { data: T[]; meta?: unknown },
): T[] => {
  if (Array.isArray(collection)) return collection;
  return collection?.data ?? [];
};

export const communityApi = {
  // ── Channels & categories ──────────────────────────────────────────
  async getCategories(): Promise<CommunityCategory[]> {
    const { data } = await api.get<CommunityCategoriesResponse>("/community/categories");
    return data.categories;
  },

  async getChannel(channelId: string): Promise<CommunityChannel> {
    const { data } = await api.get<CommunityChannelResponse>(
      `/community/channels/${channelId}`,
    );
    return data.channel;
  },

  async lockChannel(channelId: string, lock: boolean): Promise<CommunityChannel> {
    const { data } = await api.post<CommunityChannelResponse>(
      `/community/channels/${channelId}/${lock ? "lock" : "unlock"}`,
    );
    return data.channel;
  },

  // ── Messages ───────────────────────────────────────────────────────
  async getMessages(
    channelId: string,
    params: {
      thread_id?: string;
      author_id?: string;
      pinned_only?: boolean;
      official_only?: boolean;
      solved_only?: boolean;
      highlighted_only?: boolean;
      before_id?: string;
      after_id?: string;
      per_page?: number;
      page?: number;
    } = {},
  ): Promise<CommunityMessage[]> {
    const { data } = await api.get<CommunityMessagesResponse>(
      `/community/channels/${channelId}/messages`,
      { params },
    );
    return data.messages;
  },

  async storeMessage(
    channelId: string,
    payload: StoreMessagePayload,
  ): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/channels/${channelId}/messages`,
      payload,
    );
    return data.message;
  },

  async getMessage(messageId: string): Promise<CommunityMessage> {
    const { data } = await api.get<CommunityMessageResponse>(
      `/community/messages/${messageId}`,
    );
    return data.message;
  },

  async updateMessage(
    messageId: string,
    body: string,
    content_type?: string,
  ): Promise<CommunityMessage> {
    const { data } = await api.put<CommunityMessageResponse>(
      `/community/messages/${messageId}`,
      { body, ...(content_type ? { content_type } : {}) },
    );
    return data.message;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/community/messages/${messageId}`);
  },

  async pinMessage(messageId: string, pinned: boolean): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/messages/${messageId}/${pinned ? "pin" : "unpin"}`,
    );
    return data.message;
  },

  async highlightMessage(messageId: string, highlighted: boolean): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/messages/${messageId}/${highlighted ? "highlight" : "unhighlight"}`,
    );
    return data.message;
  },

  async officialMessage(messageId: string, official: boolean): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/messages/${messageId}/official${official ? "" : "/remove"}`,
    );
    return data.message;
  },

  async solveMessage(messageId: string, solved: boolean): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/messages/${messageId}/${solved ? "solve" : "unsolve"}`,
    );
    return data.message;
  },

  async acceptMessage(messageId: string, accepted: boolean): Promise<CommunityMessage> {
    const { data } = await api.post<CommunityMessageResponse>(
      `/community/messages/${messageId}/${accepted ? "accept" : "unaccept"}`,
    );
    return data.message;
  },

  async markRead(
    channelId: string,
    lastReadMessageId: string,
    threadId?: string | null,
  ): Promise<void> {
    await api.post(`/community/channels/${channelId}/read`, {
      last_read_message_id: lastReadMessageId,
      ...(threadId ? { thread_id: threadId } : {}),
    });
  },

  async seenBy(messageId: string): Promise<CommunityAuthorLike[]> {
    const { data } = await api.get<CommunitySeenByResponse>(
      `/community/messages/${messageId}/seen-by`,
    );
    return data.seen_by;
  },

  async toggleReaction(
    messageId: string,
    emoji: string,
  ): Promise<CommunityReactionResponse> {
    const { data } = await api.post<CommunityReactionResponse>(
      `/community/messages/${messageId}/reactions`,
      { emoji },
    );
    return data;
  },

  // ── Threads ────────────────────────────────────────────────────────
  async getThreads(channelId: string): Promise<CommunityThread[]> {
    const { data } = await api.get<CommunityThreadsResponse>(
      `/community/channels/${channelId}/threads`,
    );
    return data.threads;
  },

  async createThread(
    channelId: string,
    title: string,
  ): Promise<CommunityThread> {
    const { data } = await api.post<CommunityThreadResponse>(
      `/community/channels/${channelId}/threads`,
      { title },
    );
    return data.thread;
  },

  async getThread(threadId: string): Promise<CommunityThread> {
    const { data } = await api.get<CommunityThreadResponse>(
      `/community/threads/${threadId}`,
    );
    return data.thread;
  },

  async followThread(threadId: string, follow: boolean): Promise<void> {
    await api.post(`/community/threads/${threadId}/${follow ? "follow" : "unfollow"}`);
  },

  // ── Bookmarks ──────────────────────────────────────────────────────
  async getBookmarks(): Promise<CommunityBookmark[]> {
    const { data } = await api.get<CommunityBookmarksResponse>("/community/bookmarks");
    return data.bookmarks;
  },

  async bookmarkMessage(
    messageId: string,
    note?: string | null,
  ): Promise<void> {
    await api.post(`/community/messages/${messageId}/bookmark`, note ? { note } : {});
  },

  async unbookmarkMessage(messageId: string): Promise<void> {
    await api.delete(`/community/messages/${messageId}/bookmark`);
  },

  // ── Presence ───────────────────────────────────────────────────────
  async presenceOnline(status = "online", channelId?: string | null): Promise<CommunityPresence> {
    const { data } = await api.post<CommunityPresenceResponse>(
      "/community/presence/online",
      { status, ...(channelId ? { channel_id: channelId } : {}) },
    );
    return data.presence;
  },

  async presenceOffline(): Promise<void> {
    await api.post("/community/presence/offline");
  },

  async onlineMembers(channelId?: string | null): Promise<CommunityPresence[]> {
    const { data } = await api.get<CommunityOnlineMembersResponse>(
      "/community/presence/online-members",
      { params: channelId ? { channel_id: channelId } : {} },
    );
    return data.members;
  },

  async typing(channelId: string, threadId?: string | null): Promise<void> {
    await api.post(`/community/channels/${channelId}/typing`, {
      ...(threadId ? { thread_id: threadId } : {}),
    });
  },

  // ── Gamification ───────────────────────────────────────────────────
  async gamificationMe(): Promise<CommunityGamificationMeResponse> {
    const { data } = await api.get<CommunityGamificationMeResponse>(
      "/community/gamification/me",
    );
    return data;
  },

  async leaderboard(): Promise<CommunityGamification[]> {
    const { data } = await api.get<CommunityLeaderboardResponse>(
      "/community/gamification/leaderboard",
    );
    return data.leaderboard;
  },

  // ── Stats ──────────────────────────────────────────────────────────
  async stats(): Promise<CommunityStat[]> {
    const { data } = await api.get<CommunityStatsResponse>("/community/stats");
    return data.stats;
  },

  // ── Announcements ──────────────────────────────────────────────────
  async announcements(): Promise<CommunityAnnouncement[]> {
    const { data } = await api.get<CommunityAnnouncementsResponse>(
      "/community/announcements",
    );
    return data.announcements;
  },

  async storeAnnouncement(payload: {
    channel_id: string;
    title: string;
    body?: string;
    scheduled_at?: string | null;
  }): Promise<CommunityAnnouncement> {
    const { data } = await api.post<{ announcement: CommunityAnnouncement }>(
      "/community/announcements",
      payload,
    );
    return data.announcement;
  },

  // ── Notifications ──────────────────────────────────────────────────
  async notifications(params: { page?: number; per_page?: number } = {}): Promise<{
    notifications: CommunityNotification[];
    meta?: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const { data } = await api.get<CommunityNotificationsResponse>(
      "/community/notifications",
      { params },
    );
    return {
      notifications: unwrap(data.notifications),
      meta: data.notifications?.meta,
    };
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<CommunityUnreadNotificationsResponse>(
      "/community/notifications/unread",
    );
    return data.unread;
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await api.patch(`/community/notifications/${notificationId}/read`);
  },

  async archiveNotification(notificationId: string): Promise<void> {
    await api.patch(`/community/notifications/${notificationId}/archive`);
  },

  // ── Search ─────────────────────────────────────────────────────────
  async search(params: {
    q: string;
    channel_id?: string;
    author_id?: string;
    has_attachments?: boolean;
    from?: string;
    to?: string;
    per_page?: number;
  }): Promise<CommunitySearchResponse> {
    const { data } = await api.get<CommunitySearchResponse>("/community/search", {
      params,
    });
    return data;
  },
};

/** Minimal author shape returned by seen-by. */
type CommunityAuthorLike = {
  id: string | null;
  name: string | null;
  avatar: string | null;
  role?: string | null;
};
