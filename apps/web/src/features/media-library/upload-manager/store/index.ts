"use client";

import { create } from "zustand";
import type { MediaType } from "../../types";
import type { UploadItem, UploadBulkAction, UploadSource } from "../types";
import { revokeFilePreview, getFileCategory } from "../utils/files";

/** A file awaiting a name before it is enqueued for upload. */
export interface RenameDraftFile {
  id: string;
  file: File;
  defaultName: string;
  size: number;
  mime: string;
  category: MediaType;
}

export interface UploadManagerState {
  items: Record<string, UploadItem>;
  order: string[];
  isOpen: boolean;
  isDragActive: boolean;
  /** Reference counter so nested dragenter/leave pairs don't flicker the overlay. */
  dragDepth: number;

  /** Files staged in the "name before upload" dialog. */
  renameDraft: RenameDraftFile[];
  renameFolderId: number | null;
  renameSource: UploadSource | null;
  isRenameOpen: boolean;

  enqueue: (items: UploadItem[]) => void;
  patchItem: (id: string, patch: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  pauseItem: (id: string) => void;
  resumeItem: (id: string) => void;
  cancelItem: (id: string) => void;
  retryItem: (id: string) => void;
  applyBulkAction: (action: UploadBulkAction) => void;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setDragDepth: (depth: number) => void;

  /** Stage files so the teacher can rename them before they are uploaded. */
  openRename: (files: File[], opts?: { folderId?: number | null; source?: UploadSource }) => void;
  /** Discard the staged files without enqueuing anything. */
  closeRename: () => void;
}

export const useUploadManagerStore = create<UploadManagerState>((set) => ({
  items: {},
  order: [],
  isOpen: false,
  isDragActive: false,
  dragDepth: 0,
  renameDraft: [],
  renameFolderId: null,
  renameSource: null,
  isRenameOpen: false,

  enqueue: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state;
      const items = { ...state.items };
      const order = [...state.order];
      for (const item of incoming) {
        items[item.id] = item;
        if (!order.includes(item.id)) order.push(item.id);
      }
      return { items, order, isOpen: true, isDragActive: false, dragDepth: 0 };
    }),

  patchItem: (id, patch) =>
    set((state) => {
      const current = state.items[id];
      if (!current) return state;
      return { items: { ...state.items, [id]: { ...current, ...patch } } };
    }),

  removeItem: (id) =>
    set((state) => {
      const current = state.items[id];
      if (!current) return state;
      revokeFilePreview(current.preview);
      const items = { ...state.items };
      delete items[id];
      return { items, order: state.order.filter((o) => o !== id) };
    }),

  pauseItem: (id) =>
    set((state) => {
      const current = state.items[id];
      if (!current) return state;
      if (current.status === "completed" || current.status === "cancelled" || current.status === "failed") {
        return state;
      }
      return {
        items: {
          ...state.items,
          [id]: { ...current, status: "paused", speed: 0, eta: null, retryAt: null },
        },
      };
    }),

  resumeItem: (id) =>
    set((state) => {
      const current = state.items[id];
      if (!current || (current.status !== "paused" && current.status !== "recovering")) return state;
      return {
        items: {
          ...state.items,
          [id]: { ...current, status: "queued", speed: 0, eta: null, retryAt: null },
        },
      };
    }),

  cancelItem: (id) =>
    set((state) => {
      const current = state.items[id];
      if (!current) return state;
      if (current.status === "completed") return state;
      revokeFilePreview(current.preview);
      return {
        items: {
          ...state.items,
          [id]: {
            ...current,
            status: "cancelled",
            speed: 0,
            eta: null,
            retryAt: null,
            finishedAt: current.finishedAt ?? Date.now(),
          },
        },
      };
    }),

  retryItem: (id) =>
    set((state) => {
      const current = state.items[id];
      if (!current || current.status !== "failed") return state;
      return {
        items: {
          ...state.items,
          [id]: {
            ...current,
            status: "queued",
            error: null,
            progress: 0,
            speed: 0,
            eta: null,
            retryAt: null,
            startedAt: null,
            finishedAt: null,
          },
        },
      };
    }),

  applyBulkAction: (action) =>
    set((state) => {
      const items = { ...state.items };
      const ids = state.order;
      for (const id of ids) {
        const current = items[id];
        if (!current) continue;
        switch (action) {
          case "pause-all":
            if (["queued", "preparing", "uploading", "retrying", "recovering"].includes(current.status)) {
              items[id] = { ...current, status: "paused", speed: 0, eta: null, retryAt: null };
            }
            break;
          case "resume-all":
            if (current.status === "paused") {
              items[id] = { ...current, status: "queued", speed: 0, eta: null, retryAt: null };
            }
            break;
          case "cancel-all":
            if (["queued", "preparing", "uploading", "paused", "retrying", "processing"].includes(current.status)) {
              revokeFilePreview(current.preview);
              items[id] = { ...current, status: "cancelled", speed: 0, eta: null, retryAt: null, finishedAt: Date.now() };
            }
            break;
          case "retry-failed":
            if (current.status === "failed") {
              items[id] = {
                ...current,
                status: "queued",
                error: null,
                progress: 0,
                speed: 0,
                eta: null,
                retryAt: null,
                startedAt: null,
                finishedAt: null,
              };
            }
            break;
          case "clear-completed":
            if (current.status === "completed") {
              revokeFilePreview(current.preview);
              delete items[id];
            }
            break;
          case "clear-failed":
            if (current.status === "failed") {
              revokeFilePreview(current.preview);
              delete items[id];
            }
            break;
        }
      }
      const order = action === "clear-completed" || action === "clear-failed"
        ? state.order.filter((o) => items[o])
        : state.order;
      return { items, order };
    }),

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setDragDepth: (depth) =>
    set({ dragDepth: Math.max(0, depth), isDragActive: depth > 0 }),

  openRename: (files, opts) =>
    set({
      renameDraft: files.map((file) => ({
        id: `rn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        defaultName: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        category: getFileCategory(file.type, file.name),
      })),
      renameFolderId: opts?.folderId ?? null,
      renameSource: opts?.source ?? null,
      isRenameOpen: files.length > 0,
    }),

  closeRename: () => set({ isRenameOpen: false }),
}));

/** Stable selector for a single upload item (keeps memoized cards cheap). */
export function useUploadItem(id: string): UploadItem | undefined {
  return useUploadManagerStore((s) => s.items[id]);
}
