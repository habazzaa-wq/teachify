"use client";

import { useCallback, useMemo } from "react";
import { useCan } from "@/hooks/useCan";
import { useUploadManagerStore } from "../store";
import { uploadEngine, UPLOAD_PERMISSION } from "../services";
import type { UploadItem, UploadSource, UploadManagerStats } from "../types";

export function useUploadManager() {
  const canUpload = useCan(UPLOAD_PERMISSION);

  const enqueueFiles = useCallback(
    (files: File[], opts?: { folderId?: number | null; source?: UploadSource; names?: string[] }) => {
      uploadEngine.enqueue(files, { ...opts, canUpload });
    },
    [canUpload],
  );

  return {
    canUpload,
    enqueueFiles,
    pause: (id: string) => uploadEngine.pause(id),
    resume: (id: string) => uploadEngine.resume(id),
    cancel: (id: string) => uploadEngine.cancel(id),
    remove: (id: string) => uploadEngine.remove(id),
    retry: (id: string) => uploadEngine.retry(id),
    pauseAll: () => uploadEngine.pauseAll(),
    resumeAll: () => uploadEngine.resumeAll(),
    cancelAll: () => uploadEngine.cancelAll(),
    retryFailed: () => uploadEngine.retryFailed(),
    clearCompleted: () => uploadEngine.clearCompleted(),
    clearFailed: () => uploadEngine.clearFailed(),
  };
}

export function useUploadManagerItems(): UploadItem[] {
  const items = useUploadManagerStore((s) => s.items);
  const order = useUploadManagerStore((s) => s.order);
  return useMemo(
    () => order.map((id) => items[id]).filter(Boolean) as UploadItem[],
    [items, order],
  );
}

export function useUploadManagerStats(): UploadManagerStats {
  const items = useUploadManagerStore((s) => s.items);
  return useMemo(() => {
    const list = Object.values(items);
    const stats: UploadManagerStats = {
      total: list.length,
      active: 0,
      completed: 0,
      failed: 0,
      queued: 0,
      paused: 0,
      cancelled: 0,
      processing: 0,
    };
    for (const item of list) {
      switch (item.status) {
        case "uploading":
        case "preparing":
        case "retrying":
          stats.active += 1;
          break;
        case "processing":
          stats.processing += 1;
          stats.active += 1;
          break;
        case "recovering":
          stats.active += 1;
          break;
        case "completed":
          stats.completed += 1;
          break;
        case "failed":
          stats.failed += 1;
          break;
        case "queued":
          stats.queued += 1;
          break;
        case "paused":
          stats.paused += 1;
          break;
        case "cancelled":
          stats.cancelled += 1;
          break;
      }
    }
    return stats;
  }, [items]);
}
