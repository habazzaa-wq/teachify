import { api } from "@/services/api";
import type {
  MediaAsset,
  MediaFolder,
  MediaFilterParams,
  MediaMetricData,
  UploadIntent,
} from "../types";

function formatAsset(raw: any): MediaAsset {
  return {
    id: raw.id,
    tenantId: String(raw.tenantId ?? ""),
    folderId: raw.folderId ?? null,
    uploaderId: raw.uploaderId ?? null,
    type: raw.type ?? "file",
    source: raw.source ?? null,
    provider: raw.provider ?? "local",
    providerService: raw.providerService ?? null,
    bunnyVideoId: raw.bunnyVideoId ?? null,
    bunnyLibraryId: raw.bunnyLibraryId ?? null,
    bunnyStoragePath: raw.bunnyStoragePath ?? null,
    bunnyStreamUrl: raw.bunnyStreamUrl ?? null,
    cdnUrl: raw.cdnUrl ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
    previewUrl: raw.previewUrl ?? null,
    mimeType: raw.mimeType ?? null,
    extension: raw.extension ?? null,
    originalName: raw.originalName ?? raw.originalFilename ?? null,
    originalFilename: raw.originalFilename ?? null,
    title: raw.title ?? null,
    description: raw.description ?? null,
    tags: raw.tags ?? [],
    size: raw.size ?? raw.sizeBytes ?? 0,
    sizeBytes: raw.sizeBytes ?? raw.size ?? 0,
    duration: raw.duration ?? 0,
    width: raw.width ?? null,
    height: raw.height ?? null,
    status: raw.status ?? "pending",
    visibility: raw.visibility ?? "private",
    processingStatus: raw.processingStatus ?? "uploading",
    checksum: raw.checksum ?? null,
    metadata: raw.metadata ?? {},
    favorite: raw.favorite ?? false,
    favoriteAt: raw.favoriteAt ?? null,
    archivedAt: raw.archivedAt ?? null,
    deletedAt: raw.deletedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    folder: raw.folder ?? null,
    uploader: raw.uploader ?? null,
  };
}

function formatFolder(raw: any): MediaFolder {
  return {
    id: raw.id,
    parentId: raw.parentId ?? null,
    name: raw.name,
    slug: raw.slug,
    path: raw.path ?? null,
    sortOrder: raw.sortOrder ?? 0,
    childrenCount: raw.childrenCount,
    assetCount: raw.assetCount,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    children: raw.children ? raw.children.map(formatFolder) : undefined,
  };
}

function buildListParams(params?: MediaFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};

  if (params.folder_id === "root") q.root = "true";
  else if (params.folder_id !== undefined) q.folder_id = String(params.folder_id);

  if (params.search) q.search = params.search;
  if (params.type && params.type !== "all") q.type = params.type;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.visibility && params.visibility !== "all") q.visibility = params.visibility;
  if (params.processing_status && params.processing_status !== "all") q.processing_status = params.processing_status;
  if (params.favorites) q.favorites = "true";
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
  async listAssets(params?: MediaFilterParams): Promise<{ data: MediaAsset[]; meta: any }> {
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
    const body: Record<string, any> = {};
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
};
