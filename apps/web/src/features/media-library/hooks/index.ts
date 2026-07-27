"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mediaLibraryService } from "../services";
import { MEDIA_QUERY_KEY } from "../constants";
import type { MediaAsset, MediaFilterParams } from "../types";

export function useMediaAssets(params?: MediaFilterParams) {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "assets", "list", params],
    queryFn: () => mediaLibraryService.listAssets(params),
  });
}

export function useMediaAsset(id: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [MEDIA_QUERY_KEY, "assets", "detail", id],
    queryFn: () => mediaLibraryService.getAsset(id!),
    enabled: !!id,
  });

  const assetFromCache = id
    ? queryClient
        .getQueriesData<{ data: MediaAsset[] }>({ queryKey: [MEDIA_QUERY_KEY, "assets", "list"] })
        .flatMap(([, d]) => d?.data ?? [])
        .find((a) => a.id === id) ?? null
    : null;

  return {
    ...query,
    data: query.data ?? assetFromCache,
  };
}

export function useFolderTree() {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "folders", "tree"],
    queryFn: () => mediaLibraryService.getFolderTree(),
  });
}

export function useFolders(parentId?: number | null) {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "folders", "list", parentId],
    queryFn: () => mediaLibraryService.getFolders(parentId),
  });
}

export function useFolderBreadcrumbs(folderId: number | null) {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "folders", "breadcrumbs", folderId],
    queryFn: () => mediaLibraryService.getFolderBreadcrumbs(folderId!),
    enabled: !!folderId,
  });
}

export function useMediaMetrics() {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "metrics"],
    queryFn: () => mediaLibraryService.getMetrics(),
  });
}

export function useMediaStorage() {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "storage"],
    queryFn: () => mediaLibraryService.getStorage(),
  });
}

export function useRecentAssets(limit?: number) {
  return useQuery({
    queryKey: [MEDIA_QUERY_KEY, "recent", limit],
    queryFn: () => mediaLibraryService.getRecent(limit),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEY] });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: number | null }) =>
      mediaLibraryService.createFolder(name, parentId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      mediaLibraryService.renameFolder(id, name),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.deleteFolder(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMoveFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, parentId }: { id: number; parentId: number | null }) =>
      mediaLibraryService.moveFolder(id, parentId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.deleteAsset(id),
    onSuccess: () => invalidateAll(qc),
    onError: (error: Error) => {
      toast.error("Failed to delete asset", {
        description: error.message || "The asset could not be removed from the CDN. The local record was preserved.",
      });
    },
  });
}

export function useRestoreAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.restoreAsset(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDuplicateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.duplicateAsset(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRenameAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      mediaLibraryService.renameAsset(id, title),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMoveAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: number; folderId: number | null }) =>
      mediaLibraryService.moveAsset(id, folderId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.toggleFavorite(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.togglePin(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useArchiveAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaLibraryService.archiveAsset(id),
    onSuccess: () => invalidateAll(qc),
  });
}

const BULK_DELETE_CHUNK_SIZE = 15;
const BULK_DELETE_TIMEOUT = 60_000;

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const chunks: number[][] = [];
      for (let i = 0; i < ids.length; i += BULK_DELETE_CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + BULK_DELETE_CHUNK_SIZE));
      }

      let lastError: Error | null = null;
      for (const chunk of chunks) {
        try {
          await mediaLibraryService.bulkDelete(chunk, BULK_DELETE_TIMEOUT);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
      if (lastError) {
        throw lastError;
      }
    },
    onSuccess: () => invalidateAll(qc),
    onError: (error: Error) => {
      toast.error("فشل الحذف", {
        description: error.message || "لم يتم حذف بعض الملفات. حاول مرة أخرى.",
      });
    },
  });
}

export function useBulkRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => mediaLibraryService.bulkRestore(ids),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useBulkMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: number[]; folderId: number | null }) =>
      mediaLibraryService.bulkMove(ids, folderId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useBulkTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, tags }: { ids: number[]; tags: string[] }) =>
      mediaLibraryService.bulkTag(ids, tags),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreateUploadIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof mediaLibraryService.createUploadIntent>[0]) =>
      mediaLibraryService.createUploadIntent(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useConfirmUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: number;
      payload?: Parameters<typeof mediaLibraryService.confirmUpload>[1];
    }) => mediaLibraryService.confirmUpload(sessionId, payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MediaAsset> }) =>
      mediaLibraryService.updateAsset(id, data),
    onSuccess: () => invalidateAll(qc),
  });
}
