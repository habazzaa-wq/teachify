import type { MediaType } from "../../types";

export type UploadStatus =
  | "queued"
  | "preparing"
  | "uploading"
  | "paused"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "retrying"
  | "recovering";

export type UploadErrorType =
  | "network"
  | "offline"
  | "quota"
  | "cancelled"
  | "permission"
  | "server"
  | "validation"
  | "checksum"
  | "timeout"
  | "unknown";

export interface UploadError {
  type: UploadErrorType;
  message: string;
  code?: string | number;
  /** Whether this error is eligible for automatic retry. */
  retryable: boolean;
}

export type UploadWarningType = "large" | "unsupported-preview" | "slow";

export interface UploadWarning {
  type: UploadWarningType;
  message: string;
}

/* ------------------------------------------------------------------ *
 * Chunk / Session model (Phase 9.3 — Advanced Upload Engine)
 * ------------------------------------------------------------------ */

export type ChunkStatus =
  | "pending"
  | "hashing"
  | "uploading"
  | "uploaded"
  | "failed";

/** A single logical slice of a file tracked by the chunk upload engine. */
export interface UploadChunk {
  chunkId: string;
  uploadId: string;
  index: number;
  offset: number;
  size: number;
  /** SHA-256 hex digest of the chunk bytes, computed off the main thread. */
  hash: string | null;
  status: ChunkStatus;
  retryCount: number;
  uploadedAt: number | null;
}

export type UploadSessionStatus =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "expired";

/**
 * Persisted upload session. Everything required to resume an interrupted
 * upload after a refresh, crash or closed tab lives here (IndexedDB).
 */
export interface UploadSession {
  sessionId: string;
  uploadId: string;
  /** Backend upload-session id returned by createUploadIntent. */
  remoteSessionId: number | null;
  uploadUrl: string | null;
  uploadMethod: string;
  headers: Record<string, string>;
  filename: string;
  mime: string;
  size: number;
  category: MediaType;
  folderId: number | null;
  chunkSize: number;
  totalChunks: number;
  completedChunks: number;
  failedChunks: number;
  currentChunk: number;
  /** SHA-256 hex digest of the whole file (integrity). */
  fileHash: string | null;
  status: UploadSessionStatus;
  startedAt: number;
  updatedAt: number;
  expiresAt: number;
}

/** Full persisted record (session + chunk map + the file blob for recovery). */
export interface PersistedUploadRecord {
  session: UploadSession;
  chunks: UploadChunk[];
  blob: Blob;
}

export type ConnectionQuality =
  | "offline"
  | "poor"
  | "moderate"
  | "good"
  | "excellent"
  | "unknown";

export interface NetworkStatus {
  online: boolean;
  quality: ConnectionQuality;
  /** Network Information API effectiveType (4g, 3g, …) when available. */
  effectiveType: string | null;
  /** Downlink in Mbps when available. */
  downlink: number | null;
  /** Round-trip time in ms when available. */
  rtt: number | null;
  /** Measured upload throughput (bytes/sec) sampled from active chunks. */
  sampledSpeed: number | null;
  /** Concurrency the engine will apply for the current quality. */
  concurrency: number;
}

export interface UploadItem {
  id: string;
  file: File;
  preview: string | null;
  filename: string;
  size: number;
  mime: string;
  category: MediaType;
  /** Real percentage 0-100. */
  progress: number;
  /** Bytes per second (smoothed). */
  speed: number;
  /** Estimated seconds remaining, null when unknown. */
  eta: number | null;
  status: UploadStatus;
  retryCount: number;
  /** Total logical chunks the file is split into. */
  chunkCount: number;
  /** Chunks already uploaded (drives chunk-level progress). */
  uploadedChunks: number;
  /** Chunk size (bytes) selected adaptively for this file. */
  chunkSize: number;
  /** Whether the chunk/resumable transport is used (vs. direct fallback). */
  resumable: boolean;
  /** Whether this item was recovered from IndexedDB after a reload/crash. */
  recovered: boolean;
  /** SHA-256 hex digest of the whole file once computed. */
  fileHash: string | null;
  /** Whether the file checksum has been verified. */
  checksumVerified: boolean;
  error: UploadError | null;
  warning: UploadWarning | null;
  /** Epoch ms when an automatic retry is scheduled. Drives the countdown UI. */
  retryAt: number | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  /** Resolved media asset id after a successful upload. */
  assetId: number | null;
  /** Public CDN url after a successful upload. */
  cdnUrl: string | null;
  /** Target folder, propagated from the enqueue context. */
  folderId: number | null;
}

export type UploadBulkAction =
  | "pause-all"
  | "resume-all"
  | "cancel-all"
  | "retry-failed"
  | "clear-completed"
  | "clear-failed";

export interface UploadManagerStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  queued: number;
  paused: number;
  cancelled: number;
  processing: number;
}

export type UploadSource = "file-input" | "folder-input" | "drag-drop" | "paste" | "shortcut";
