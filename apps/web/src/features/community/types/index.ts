export type CommunityRole =
  | "member"
  | "moderator"
  | "admin"
  | "super_admin"
  | null;

export type CommunityMessageContentType =
  | "text"
  | "code"
  | "math"
  | "announcement"
  | "image"
  | "file"
  | "pdf"
  | "voice"
  | "video";

export type CommunityPresenceStatus =
  | "online"
  | "away"
  | "busy"
  | "offline";

export interface CommunityAuthor {
  id: string | null;
  name: string | null;
  avatar: string | null;
  role: CommunityRole;
}

export interface CommunityReactionMember {
  id: string | null;
  name: string | null;
  avatar: string | null;
}

export interface CommunityReaction {
  emoji: string;
  count: number;
  members: CommunityReactionMember[];
}

export interface CommunityAttachment {
  id: string;
  type: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  url: string | null;
  media_asset_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CommunityMessage {
  id: string;
  channel_id: string;
  thread_id: string | null;
  parent_message_id: string | null;
  reply_to_message_id: string | null;
  author: CommunityAuthor | null;
  avatar: string | null;
  role: CommunityRole;
  body: string;
  body_text: string | null;
  content_type: CommunityMessageContentType;
  status: string;
  edited: boolean;
  pinned: boolean;
  announcement: boolean;
  official_answer: boolean;
  accepted_answer: boolean;
  solved: boolean;
  highlighted: boolean;
  attachments: CommunityAttachment[];
  reactions: CommunityReaction[];
  reply_count: number;
  thread_count: number;
  metadata: Record<string, unknown> | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_default: boolean;
  allows_questions: boolean;
  moderator_only: boolean;
  status: string;
  channels: CommunityChannel[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunityChannel {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  is_locked: boolean;
  is_pinned: boolean;
  allows_questions: boolean;
  sort_order: number;
  messages_count: number;
  last_message_at: string | null;
  last_message: CommunityMessage | null;
  category: CommunityCategory | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunityThread {
  id: string;
  channel_id: string;
  title: string;
  status: string;
  is_pinned: boolean;
  is_locked: boolean;
  last_message_at: string | null;
  creator: CommunityAuthor | null;
  channel: CommunityChannel | null;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityPresence {
  id: string | null;
  name: string | null;
  avatar: string | null;
  status: CommunityPresenceStatus;
  current_channel_id: string | null;
  last_seen_at: string | null;
}

export interface CommunityGamification {
  rank: number;
  member_id: string | null;
  name: string | null;
  avatar: string | null;
  total_xp: number;
  actions: number;
  last_action_at: string | null;
}

export interface CommunityStat {
  key: string;
  value: number;
  payload: Record<string, unknown> | null;
  updated_at: string | null;
}

export interface CommunityNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  status: string;
  priority: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface CommunityBookmark {
  id: string;
  note: string | null;
  message: CommunityMessage | null;
  created_at: string;
}

export interface CommunityAnnouncement {
  id: string;
  channel_id: string;
  title: string;
  body: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  channel: CommunityChannel | null;
  creator: CommunityAuthor | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityReport {
  id: string;
  message_id: string | null;
  message: CommunityMessage | null;
  reason: string;
  note: string | null;
  status: string;
  reporter: CommunityAuthor | null;
  reviewer: CommunityAuthor | null;
  reviewed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CommunityMessagesResponse {
  messages: {
    data: CommunityMessage[];
    meta?: PaginationMeta;
  };
}

export interface CommunityCategoriesResponse {
  categories: CommunityCategory[];
}

export interface CommunityChannelResponse {
  channel: CommunityChannel;
}

export interface CommunityThreadsResponse {
  threads: CommunityThread[];
}

export interface CommunityThreadResponse {
  thread: CommunityThread;
}

export interface CommunityMessageResponse {
  message: CommunityMessage;
}

export interface CommunityPresenceResponse {
  presence: CommunityPresence;
}

export interface CommunityOnlineMembersResponse {
  members: CommunityPresence[];
}

export interface CommunityGamificationMeResponse {
  total_xp: number;
  today_xp: number;
  rank: string;
}

export interface CommunityLeaderboardResponse {
  leaderboard: CommunityGamification[];
}

export interface CommunityStatsResponse {
  stats: CommunityStat[];
}

export interface CommunityNotificationsResponse {
  notifications: {
    data: CommunityNotification[];
    meta?: PaginationMeta;
  };
}

export interface CommunityUnreadNotificationsResponse {
  unread: number;
}

export interface CommunityBookmarksResponse {
  bookmarks: CommunityBookmark[];
}

export interface CommunityAnnouncementsResponse {
  announcements: CommunityAnnouncement[];
}

export interface CommunitySearchResponse {
  messages: CommunityMessage[];
  threads: CommunityThread[];
}

export interface CommunityReactionResponse {
  action: "added" | "removed";
  reaction: CommunityReaction | null;
}

export interface CommunitySeenByResponse {
  seen_by: CommunityAuthor[];
}

export interface StoreMessagePayload {
  body: string;
  content_type?: CommunityMessageContentType;
  thread_id?: string | null;
  parent_message_id?: string | null;
  reply_to_message_id?: string | null;
  mentions?: string[];
  attachments?: Array<{
    type: string;
    file_name?: string | null;
    mime_type?: string | null;
    size_bytes?: number | null;
    duration_seconds?: number | null;
    url?: string | null;
    media_asset_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
  client_message_id?: string;
  is_announcement?: boolean;
}

export interface SeenByPayload {
  messageId: string;
  members: CommunityAuthor[];
}

export interface CommunityStatsMap {
  active_members?: number;
  online_members?: number;
  today_messages?: number;
  total_messages?: number;
  total_threads?: number;
  total_reactions?: number;
  latest_message?: CommunityMessage;
  [key: string]: number | CommunityMessage | undefined;
}
