/** React Query keys for the community feature. */

export const communityKeys = {
  all: ["community"] as const,
  categories: () => [...communityKeys.all, "categories"] as const,
  channel: (channelId: string) =>
    [...communityKeys.all, "channel", channelId] as const,
  messages: (channelId: string, scope?: string) =>
    [...communityKeys.all, "messages", channelId, scope ?? "main"] as const,
  message: (messageId: string) =>
    [...communityKeys.all, "message", messageId] as const,
  threads: (channelId: string) =>
    [...communityKeys.all, "threads", channelId] as const,
  thread: (threadId: string) =>
    [...communityKeys.all, "thread", threadId] as const,
  bookmarks: () => [...communityKeys.all, "bookmarks"] as const,
  pinnedMessages: () => [...communityKeys.all, "pinned-messages"] as const,
  presence: () => [...communityKeys.all, "presence"] as const,
  gamification: {
    all: () => [...communityKeys.all, "gamification"] as const,
    me: () => [...communityKeys.gamification.all(), "me"] as const,
    leaderboard: () =>
      [...communityKeys.gamification.all(), "leaderboard"] as const,
  },
  stats: () => [...communityKeys.all, "stats"] as const,
  announcements: () => [...communityKeys.all, "announcements"] as const,
  notifications: {
    all: () => [...communityKeys.all, "notifications"] as const,
    list: () => [...communityKeys.notifications.all(), "list"] as const,
    unread: () => [...communityKeys.notifications.all(), "unread"] as const,
  },
  search: (query: string) =>
    [...communityKeys.all, "search", query] as const,
};
