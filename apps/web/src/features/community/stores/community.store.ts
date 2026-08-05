"use client";

import { create } from "zustand";
import type { CommunityAuthor } from "../types";

export type CommunityConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected";

export interface TypingUser {
  memberId: string;
  name: string;
  avatar: string | null;
  at: number;
}

interface CommunityState {
  activeChannelId: string | null;
  activeThreadId: string | null;
  mobileChannelsOpen: boolean;
  rightPaneOpen: boolean;
  searchOpen: boolean;
  examBlocked: boolean;
  connection: CommunityConnectionStatus;
  unreadByChannel: Record<string, number>;
  typingByChannel: Record<string, TypingUser[]>;
  seenByMessage: Record<string, CommunityAuthor[]>;
  onlineMemberIds: string[];

  setActiveChannel: (channelId: string | null) => void;
  setActiveThread: (threadId: string | null) => void;
  openThread: (threadId: string, channelId: string) => void;
  closeThread: () => void;
  setMobileChannelsOpen: (open: boolean) => void;
  setRightPaneOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setExamBlocked: (blocked: boolean) => void;
  setConnection: (status: CommunityConnectionStatus) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setUnread: (channelId: string, count: number) => void;
  upsertTyping: (channelId: string, user: TypingUser) => void;
  clearTyping: (channelId: string, memberId: string) => void;
  clearChannelTyping: (channelId: string) => void;
  setSeenBy: (messageId: string, members: CommunityAuthor[]) => void;
  setOnlineMemberIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
  reset: () => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  activeChannelId: null,
  activeThreadId: null,
  mobileChannelsOpen: false,
  rightPaneOpen: true,
  searchOpen: false,
  examBlocked: false,
  connection: "connecting",
  unreadByChannel: {},
  typingByChannel: {},
  seenByMessage: {},
  onlineMemberIds: [],

  setActiveChannel: (channelId) =>
    set({ activeChannelId: channelId, activeThreadId: null }),

  setActiveThread: (threadId) => set({ activeThreadId: threadId }),

  openThread: (threadId, channelId) =>
    set({ activeThreadId: threadId, activeChannelId: channelId }),

  closeThread: () => set({ activeThreadId: null }),

  setMobileChannelsOpen: (open) => set({ mobileChannelsOpen: open }),

  setRightPaneOpen: (open) => set({ rightPaneOpen: open }),

  setSearchOpen: (open) => set({ searchOpen: open }),

  setExamBlocked: (blocked) => set({ examBlocked: blocked }),

  setConnection: (status) => set({ connection: status }),

  incrementUnread: (channelId) =>
    set((state) => ({
      unreadByChannel: {
        ...state.unreadByChannel,
        [channelId]: (state.unreadByChannel[channelId] ?? 0) + 1,
      },
    })),

  clearUnread: (channelId) =>
    set((state) => {
      if (!state.unreadByChannel[channelId]) return state;
      const next = { ...state.unreadByChannel };
      delete next[channelId];
      return { unreadByChannel: next };
    }),

  setUnread: (channelId, count) =>
    set((state) => ({
      unreadByChannel: { ...state.unreadByChannel, [channelId]: count },
    })),

  upsertTyping: (channelId, user) =>
    set((state) => {
      const list = state.typingByChannel[channelId] ?? [];
      const idx = list.findIndex((u) => u.memberId === user.memberId);
      const next =
        idx >= 0
          ? list.map((u, i) => (i === idx ? user : u))
          : [...list, user];
      return { typingByChannel: { ...state.typingByChannel, [channelId]: next } };
    }),

  clearTyping: (channelId, memberId) =>
    set((state) => {
      const list = state.typingByChannel[channelId] ?? [];
      const next = list.filter((u) => u.memberId !== memberId);
      if (next.length === list.length) return state;
      return { typingByChannel: { ...state.typingByChannel, [channelId]: next } };
    }),

  clearChannelTyping: (channelId) =>
    set((state) => {
      if (!state.typingByChannel[channelId]) return state;
      const next = { ...state.typingByChannel };
      delete next[channelId];
      return { typingByChannel: next };
    }),

  setSeenBy: (messageId, members) =>
    set((state) => ({
      seenByMessage: { ...state.seenByMessage, [messageId]: members },
    })),

  setOnlineMemberIds: (ids) =>
    set((state) => ({
      onlineMemberIds:
        typeof ids === "function"
          ? ids(state.onlineMemberIds)
          : ids,
    })),

  reset: () =>
    set({
      activeChannelId: null,
      activeThreadId: null,
      mobileChannelsOpen: false,
      examBlocked: false,
      connection: "disconnected",
      unreadByChannel: {},
      typingByChannel: {},
      seenByMessage: {},
      onlineMemberIds: [],
    }),
}));
