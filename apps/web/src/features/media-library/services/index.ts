import { api } from "@/services/api";
import { resolveApiBaseUrl } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type {
  MediaAsset,
  MediaCaption,
  MediaFolder,
  MediaMetricData,
  MediaQuality,
  MediaUsage,
  MediaFilterParams,
  ProcessingStatus,
  UploadIntent,
} from "../types";

type RawAsset = Record<string, unknown>;
type RawFolder = Record<string, unknown>;

function num(raw: unknown, fallback = 0): number {
  return typeof raw === "number" ? raw : fallback;
}

function str(raw: unknown, fallback: string | null = null): string | null {
  return raw === undefined || raw === null ? fallback : String(raw);
}

function formatAsset(raw: RawAsset): MediaAsset {
  const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
  const folder = raw.folder as MediaAsset["folder"];
  const uploader = raw.uploader as MediaAsset["uploader"];
  const meta = raw.metadata as Record<string, unknown> | undefined;
  return {
    id: num(raw.id),
    tenantId: str(raw.tenantId, "") ?? "",
    folderId: raw.folderId == null ? null : num(raw.folderId),
    uploaderId: raw.uploaderId == null ? null : num(raw.uploaderId),
    createdById: raw.createdById == null ? null : num(raw.createdById),
    type: (str(raw.type, "file") ?? "file") as MediaAsset["type"],
    slug: str(raw.slug),
    source: str(raw.source),
    provider: str(raw.provider, "local") ?? "local",
    providerService: str(raw.providerService),
    collectionId: raw.collectionId == null ? null : num(raw.collectionId),
    bunnyVideoId: str(raw.bunnyVideoId),
    bunnyLibraryId: str(raw.bunnyLibraryId),
    bunnyStoragePath: str(raw.bunnyStoragePath),
    bunnyStreamUrl: str(raw.bunnyStreamUrl),
    cdnUrl: str(raw.cdnUrl),
    thumbnailUrl: str(raw.thumbnailUrl),
    previewUrl: str(raw.previewUrl),
    posterUrl: str(raw.posterUrl),
    mimeType: str(raw.mimeType),
    extension: str(raw.extension),
    originalName: str(raw.originalName) ?? str(raw.originalFilename),
    originalFilename: str(raw.originalFilename),
    title: str(raw.title),
    description: str(raw.description),
    language: str(raw.language),
    tags,
    size: num(raw.size) || num(raw.sizeBytes),
    sizeBytes: num(raw.sizeBytes) || num(raw.size),
    duration: num(raw.duration),
    width: raw.width == null ? null : num(raw.width),
    height: raw.height == null ? null : num(raw.height),
    status: (str(raw.status, "pending") ?? "pending") as MediaAsset["status"],
    visibility: (str(raw.visibility, "private") ?? "private") as MediaAsset["visibility"],
    processingStatus: (str(raw.processingStatus, "uploading") ??
      "uploading") as MediaAsset["processingStatus"],
    transcodingStatus: raw.transcodingStatus == null
      ? null
      : (str(raw.transcodingStatus) as ProcessingStatus),
    isProcessing: raw.isProcessing === true,
    processingProgress: num(raw.processingProgress),
    captions: Array.isArray(raw.captions) ? (raw.captions as MediaCaption[]) : [],
    qualities: Array.isArray(raw.qualities) ? (raw.qualities as MediaQuality[]) : [],
    checksum: str(raw.checksum),
    metadata: meta ?? {},
    favorite: raw.favorite === true,
    favoriteAt: str(raw.favoriteAt),
    pinned: raw.pinned === true,
    pinnedAt: str(raw.pinnedAt),
    archivedAt: str(raw.archivedAt),
    deletedAt: str(raw.deletedAt),
    createdAt: str(raw.createdAt) ?? "",
    updatedAt: str(raw.updatedAt) ?? "",
    folder,
    uploader,
    createdBy: raw.createdBy as MediaAsset["createdBy"],
    usages: Array.isArray(raw.usages) ? (raw.usages as MediaUsage[]) : [],
  };
}

function formatFolder(raw: RawFolder): MediaFolder {
  const children = Array.isArray(raw.children)
    ? (raw.children as RawFolder[]).map(formatFolder)
    : undefined;
  return {
    id: num(raw.id),
    parentId: raw.parentId == null ? null : num(raw.parentId),
    name: str(raw.name) ?? "",
    slug: str(raw.slug) ?? "",
    path: str(raw.path),
    sortOrder: num(raw.sortOrder),
    childrenCount: raw.childrenCount == null ? undefined : num(raw.childrenCount),
    assetCount: raw.assetCount == null ? undefined : num(raw.assetCount),
    createdAt: str(raw.createdAt) ?? "",
    updatedAt: str(raw.updatedAt) ?? "",
    children,
  };
}

function buildListParams(params?: MediaFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};

  if (params.folder_id === "root") q.root = "true";
  else if (params.folder_id !== undefined) q.folder_id = String(params.folder_id);

  if (params.search) q.search = params.search;
  if (params.type && params.type !== "all") q.type = params.type;
  if (params.types && params.types.length > 0) q.types = params.types.join(",");
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.visibility && params.visibility !== "all") q.visibility = params.visibility;
  if (params.processing_status && params.processing_status !== "all") q.processing_status = params.processing_status;
  if (params.favorites) q.favorites = "true";
  if (params.pinned) q.pinned = "true";
  if (params.archived) q.archived = "true";
  if (params.extension) q.extension = params.extension;
  if (params.uploader_id) q.uploader_id = String(params.uploader_id);
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);

  return q;
}

export const mediaLibraryService = {
  async listAssets(params?: MediaFilterParams): Promise<{ data: MediaAsset[]; meta: Record<string, unknown> }> {
    const { data } = await api.get("/media-library/assets", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatAsset),
      meta: data.meta ?? {},
    };
  },

  async getAsset(id: number): Promise<MediaAsset | null> {
    const { data } = await api.get(`/media-library/assets/${id}`);
    return data.data ? formatAsset(data.data) : null;
  },

  async updateAsset(id: number, payload: Partial<MediaAsset>): Promise<MediaAsset | null> {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.tags !== undefined) body.tags = payload.tags;
    if (payload.visibility !== undefined) body.visibility = payload.visibility;
    if (payload.folderId !== undefined) body.folder_id = payload.folderId;

    const { data } = await api.put(`/media-library/assets/${id}`, body);
    return data.data ? formatAsset(data.data) : null;
  },

  async deleteAsset(id: number): Promise<void> {
    await api.delete(`/media-library/assets/${id}`);
  },

  async restoreAsset(id: number): Promise<MediaAsset | null> {
    const { data } = await api.post(`/media-library/assets/${id}/restore`);
    return data.data ? formatAsset(data.data) : null;
  },

  async duplicateAsset(id: number): Promise<MediaAsset | null> {
    const { data } = await api.post(`/media-library/assets/${id}/duplicate`);
    return data.data ? formatAsset(data.data) : null;
  },

  async renameAsset(id: number, title: string): Promise<MediaAsset | null> {
    const { data } = await api.put(`/media-library/assets/${id}/rename`, { title });
    return data.data ? formatAsset(data.data) : null;
  },

  async moveAsset(id: number, folderId: number | null): Promise<MediaAsset | null> {
    const { data } = await api.put(`/media-library/assets/${id}/move`, { folder_id: folderId });
    return data.data ? formatAsset(data.data) : null;
  },

  async toggleFavorite(id: number): Promise<MediaAsset | null> {
    const { data } = await api.post(`/media-library/assets/${id}/favorite`);
    return data.data ? formatAsset(data.data) : null;
  },

  async togglePin(id: number): Promise<MediaAsset | null> {
    const { data } = await api.post(`/media-library/assets/${id}/pin`);
    return data.data ? formatAsset(data.data) : null;
  },

  async archiveAsset(id: number): Promise<MediaAsset | null> {
    const { data } = await api.post(`/media-library/assets/${id}/archive`);
    return data.data ? formatAsset(data.data) : null;
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await api.post("/media-library/assets/bulk/delete", { ids });
  },

  async bulkRestore(ids: number[]): Promise<void> {
    await api.post("/media-library/assets/bulk/restore", { ids });
  },

  async bulkMove(ids: number[], folderId: number | null): Promise<void> {
    await api.post("/media-library/assets/bulk/move", { ids, folder_id: folderId });
  },

  async bulkTag(ids: number[], tags: string[]): Promise<void> {
    await api.post("/media-library/assets/bulk/tag", { ids, tags });
  },

  async getFolderTree(): Promise<MediaFolder[]> {
    const { data } = await api.get("/media-library/folders/tree");
    return (data.data ?? []).map(formatFolder);
  },

  async getFolders(parentId?: number | null): Promise<MediaFolder[]> {
    const params: Record<string, string> = {};
    if (parentId !== undefined && parentId !== null) params.parent_id = String(parentId);
    const { data } = await api.get("/media-library/folders", { params });
    return (data.data ?? []).map(formatFolder);
  },

  async createFolder(name: string, parentId?: number | null): Promise<MediaFolder> {
    const { data } = await api.post("/media-library/folders", { name, parent_id: parentId ?? undefined });
    return formatFolder(data.data);
  },

  async renameFolder(id: number, name: string): Promise<MediaFolder> {
    const { data } = await api.put(`/media-library/folders/${id}`, { name });
    return formatFolder(data.data);
  },

  async deleteFolder(id: number): Promise<void> {
    await api.delete(`/media-library/folders/${id}`);
  },

  async moveFolder(id: number, parentId: number | null): Promise<MediaFolder> {
    const { data } = await api.put(`/media-library/folders/${id}/move`, {
      parent_id: parentId ?? null,
    });
    return formatFolder(data.data);
  },

  async getFolderBreadcrumbs(id: number): Promise<Array<{ id: number; name: string }>> {
    const { data } = await api.get(`/media-library/folders/${id}/breadcrumbs`);
    return data.data ?? [];
  },

  async getMetrics(): Promise<MediaMetricData> {
    const { data } = await api.get("/media-library/metrics");
    return data.data;
  },

  async getStorage(): Promise<{ used: number; remaining: number; total: number; usage_percent: number }> {
    const { data } = await api.get("/media-library/storage");
    return data.data;
  },

  async getRecent(limit?: number): Promise<MediaAsset[]> {
    const { data } = await api.get("/media-library/recent", {
      params: limit ? { limit } : undefined,
    });
    return (data.data ?? []).map(formatAsset);
  },

  async createUploadIntent(payload: {
    type: string;
    original_filename: string;
    mime_type?: string;
    size_bytes?: number;
    folder_id?: number;
    visibility?: string;
    service?: string;
    title?: string;
    upload_id?: string;
    total_chunks?: number;
  }): Promise<UploadIntent> {
    const { data } = await api.post("/media-library/upload/intent", payload);
    return {
      asset: formatAsset(data.data.asset),
      sessionId: data.data.session_id,
      uploadUrl: data.data.upload_url,
      uploadMethod: data.data.upload_method,
      headers: data.data.headers,
      expiresAt: data.data.expires_at,
    };
  },

  async createResumableIntent(payload: {
    type: string;
    original_filename: string;
    mime_type?: string;
    size_bytes?: number;
    folder_id?: number;
    visibility?: string;
    service?: string;
    title?: string;
    upload_id?: string;
    total_chunks?: number;
  }): Promise<UploadIntent> {
    const { data } = await api.post("/media-library/upload/resumable/intent", payload);
    return {
      asset: formatAsset(data.data.asset),
      sessionId: data.data.session_id,
      uploadUrl: data.data.upload_url,
      uploadMethod: data.data.upload_method,
      headers: data.data.headers,
      expiresAt: data.data.expires_at,
    };
  },

  async confirmUpload(
    sessionId: number,
    payload?: {
      size_bytes?: number;
      duration_seconds?: number;
      thumbnail_url?: string;
      preview_url?: string;
      cdn_url?: string;
      width?: number;
      height?: number;
      bunny_stream_url?: string;
    },
  ): Promise<{ asset: MediaAsset | null }> {
    const { data } = await api.post(`/media-library/upload/${sessionId}/confirm`, payload ?? {});
    return {
      asset: data.data?.asset ? formatAsset(data.data.asset) : null,
    };
  },

  async finalizeResumable(
    sessionId: number,
    payload?: {
      size_bytes?: number;
      file_hash?: string;
    },
  ): Promise<{ asset: MediaAsset | null }> {
    const { data } = await api.post(`/media-library/upload/resumable/${sessionId}/finalize`, {
      size_bytes: payload?.size_bytes,
      file_hash: payload?.file_hash,
    });
    return {
      asset: data.data?.asset ? formatAsset(data.data.asset) : null,
    };
  },

  async resumeResumable(sessionId: number): Promise<{
    sessionId: number;
    completedChunks: number[];
    remainingChunks: number[];
    nextChunk: number | null;
    totalChunks: number;
    completed: boolean;
  }> {
    const { data } = await api.get(`/media-library/upload/resumable/${sessionId}/resume`);
    const d = data.data ?? {};
    return {
      sessionId,
      completedChunks: d.completed_chunks ?? [],
      remainingChunks: d.remaining_chunks ?? [],
      nextChunk: d.next_chunk ?? null,
      totalChunks: d.total_chunks ?? 0,
      completed: Boolean(d.completed),
    };
  },

  async uploadFileDirect(
    file: File,
    visibility?: string,
  ): Promise<{ asset: MediaAsset | null; cdnUrl: string | null }> {
    const form = new FormData();
    form.append("file", file);
    if (visibility) form.append("visibility", visibility);

    // Build the same auth/tenant context the axios interceptor would, but use
    // the native fetch API so the browser sets the multipart boundary and the
    // file is transmitted correctly (axios forced a JSON content-type).
    const token =
      (() => {
        try {
          return useAuthStore.getState().accessToken;
        } catch {
          return null;
        }
      })() ?? undefined;

    const tenantId =
      (() => {
        try {
          return useTenantStore.getState().activeTenant?.id?.toString() ?? null;
        } catch {
          return null;
        }
      })() ?? undefined;

    const domain =
      (() => {
        try {
          return useTenantStore.getState().domain ?? null;
        } catch {
          return null;
        }
      })() ?? undefined;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    else if (domain) headers["X-Tenant-Domain"] = domain;

    const baseUrl = (() => {
      try {
        return resolveApiBaseUrl();
      } catch {
        return "/api";
      }
    })();

    const res = await fetch(`${baseUrl}/media-library/upload/file`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    });

    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore non-json bodies
      }
      throw new Error(message);
    }

    const json = await res.json();
    const data = json.data ?? json;

    return {
      asset: data?.asset ? formatAsset(data.asset) : null,
      cdnUrl: data?.cdn_url ?? null,
    };
  },
};
