export type MediaType = "video" | "image" | "audio" | "document" | "pdf" | "zip" | "presentation" | "spreadsheet" | "link" | "file";

export type MediaStatus = "pending" | "uploading" | "processing" | "ready" | "failed";

export type ProcessingStatus = "uploading" | "processing" | "ready" | "failed" | "archived" | "deleted";

export type MediaVisibility = "private" | "organization" | "public";

export interface MediaFolder {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  path: string | null;
  sortOrder: number;
  childrenCount?: number;
  assetCount?: number;
  createdAt: string;
  updatedAt: string;
  children?: MediaFolder[];
}

export interface MediaCaption {
  id: number;
  language: string;
  label: string;
  url: string;
}

export interface MediaQuality {
  label: string;
  width: number;
  height: number;
  url: string;
}

export interface MediaAsset {
  id: number;
  tenantId: string;
  folderId: number | null;
  uploaderId: number | null;
  createdById: number | null;
  type: MediaType;
  slug: string | null;
  source: string | null;
  provider: string;
  providerService: string | null;
  collectionId: number | null;
  bunnyVideoId: string | null;
  bunnyLibraryId: string | null;
  bunnyStoragePath: string | null;
  bunnyStreamUrl: string | null;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  posterUrl: string | null;
  mimeType: string | null;
  extension: string | null;
  originalName: string | null;
  originalFilename: string | null;
  title: string | null;
  description: string | null;
  language: string | null;
  tags: string[];
  size: number;
  sizeBytes: number;
  duration: number;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  visibility: MediaVisibility;
  processingStatus: ProcessingStatus;
  transcodingStatus: ProcessingStatus | null;
  isProcessing: boolean;
  processingProgress: number;
  captions: MediaCaption[];
  qualities: MediaQuality[];
  checksum: string | null;
  metadata: Record<string, unknown>;
  favorite: boolean;
  favoriteAt: string | null;
  pinned: boolean;
  pinnedAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  folder: { id: number; name: string; path: string | null } | null;
  uploader: { id: number; name: string; avatar: string | null } | null;
  createdBy: { id: number; name: string; avatar: string | null } | null;
  usages: MediaUsage[];
}

export interface MediaFilterParams {
  folder_id?: number | "root";
  root?: boolean;
  search?: string;
  type?: MediaType | "all";
  types?: MediaType[];
  status?: MediaStatus | "all" | "archived";
  visibility?: MediaVisibility | "all";
  processing_status?: ProcessingStatus | "all";
  favorites?: boolean;
  pinned?: boolean;
  archived?: boolean;
  extension?: string;
  uploader_id?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  sort?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface MediaMetricData {
  totalAssets: number;
  totalSize: number;
  videos: number;
  images: number;
  documents: number;
  audio: number;
  archived: number;
  processing: number;
  favorites: number;
  recentUploads: number;
  storageUsed: number;
  storageRemaining: number;
  storageTotal: number;
  usagePercent: number;
}

export interface UploadIntent {
  asset?: MediaAsset | null;
  sessionId: number;
  uploadUrl: string | null;
  uploadMethod: string;
  headers: Record<string, string>;
  expiresAt: string | null;
}

export type MediaUsageEntity = "course" | "lecture" | "section" | "assignment" | "certificate" | "announcement";

export interface MediaUsage {
  id: number;
  entityType: MediaUsageEntity;
  entityId: number;
  entityTitle: string;
  context?: string;
  url?: string | null;
}

export type ViewMode = "grid" | "list" | "compact" | "large";

export type AssetGroupBy = "none" | "type" | "date" | "owner" | "size";

export type SmartFolderType = "recent" | "images" | "videos" | "audio" | "documents" | "archives" | "favorites" | "pinned" | "trash" | "shared";

export interface SmartFolder {
  id: SmartFolderType;
  label: string;
  icon: string;
  count?: number;
}
