import type { ConnectionQuality, UploadStatus } from "../types";

/** How many upload *items* run concurrently (each item runs its own chunks). */
export const UPLOAD_CONCURRENCY = 4;

export const UPLOAD_MAX_RETRIES = 5;

/** Base backoff for automatic retries (network/server errors). */
export const UPLOAD_RETRY_BASE_DELAY = 2_000;

/** Upper bound for the exponential backoff. */
export const UPLOAD_RETRY_MAX_DELAY = 30_000;

/** Speed smoothing factor (0-1); higher = more reactive. */
export const UPLOAD_SPEED_SMOOTHING = 0.25;

/** Below this bytes/sec we surface a slow-upload warning. */
export const UPLOAD_SLOW_THRESHOLD = 50_000;

/** Files larger than this surface a size warning. */
export const UPLOAD_LARGE_FILE_BYTES = 500_000_000;

/** Permission slug required to enqueue uploads (RBAC). */
export const UPLOAD_PERMISSION = "media.upload";

/* ------------------------------------------------------------------ *
 * Chunk engine tuning
 * ------------------------------------------------------------------ */

export const KB = 1_024;
export const MB = 1_024 * KB;

/** Supported adaptive chunk sizes (bytes). */
export const CHUNK_SIZE_256KB = 256 * KB;
export const CHUNK_SIZE_512KB = 512 * KB;
export const CHUNK_SIZE_1MB = 1 * MB;
export const CHUNK_SIZE_2MB = 2 * MB;
export const CHUNK_SIZE_4MB = 4 * MB;

/**
 * Adaptive chunk-size thresholds. The first bucket whose `maxFileSize`
 * exceeds the file size wins. Ordered ascending.
 */
export const CHUNK_SIZE_TABLE: ReadonlyArray<{ maxFileSize: number; chunkSize: number }> = [
  { maxFileSize: 10 * MB, chunkSize: CHUNK_SIZE_256KB },
  { maxFileSize: 100 * MB, chunkSize: CHUNK_SIZE_512KB },
  { maxFileSize: 500 * MB, chunkSize: CHUNK_SIZE_1MB },
  { maxFileSize: 2_000 * MB, chunkSize: CHUNK_SIZE_2MB },
  { maxFileSize: Number.POSITIVE_INFINITY, chunkSize: CHUNK_SIZE_4MB },
];

/** Files at or below this size skip chunking and use the direct transport. */
export const CHUNK_MIN_FILE_SIZE = 5 * MB;

/** Default number of chunks uploaded in parallel per item. */
export const CHUNK_PARALLEL_DEFAULT = 4;

/** Per-connection-quality parallel chunk budget (adaptive parallelism). */
export const CHUNK_PARALLEL_BY_QUALITY: Record<ConnectionQuality, number> = {
  offline: 0,
  poor: 1,
  moderate: 2,
  good: 4,
  excellent: 6,
  unknown: CHUNK_PARALLEL_DEFAULT,
};

/** Max retries for an individual chunk before the whole item fails. */
export const CHUNK_MAX_RETRIES = 5;

/** Idle-watchdog window (ms) used per chunk instead of an absolute wall-clock
 * deadline. A chunk is aborted ONLY when the upload makes no forward progress
 * for this long. On a slow-but-working link a large chunk may legitimately
 * take far longer than a fixed 2-minute deadline to transfer; because we keep
 * resetting the watchdog on every `onprogress`, the transfer is never killed
 * mid-flight as long as bytes are still flowing. This eliminates the
 * progress-jump-back + repeated-timeout + eventual-hard-fail spiral our users
 * saw over slow/flaky VPNs.
 */
export const CHUNK_IDLE_TIMEOUT_MS = 30_000;

/**
 * ETA horizon (seconds). Estimates longer than this are effectively unknown on
 * an active but slow link and are reported as null so the UI never shows a
 * fabricated multi-hour/day countdown ("المدة زادت جداً" complaint).
 */
export const UPLOAD_ETA_SHOW_MAX_SECONDS = 6 * 3_600;

/** IndexedDB database + store names for session persistence. */
export const UPLOAD_DB_NAME = "upload-engine";
export const UPLOAD_DB_VERSION = 1;
export const UPLOAD_DB_STORE = "sessions";
export const UPLOAD_DB_UPLOAD_INDEX = "uploadId";

/** How long a persisted session is considered recoverable (24h). */
export const UPLOAD_SESSION_TTL = 24 * 60 * 60 * 1_000;

/** Background Sync tag registered with the service worker when available. */
export const UPLOAD_SYNC_TAG = "upload-engine-sync";

/** Number of hashing workers kept in the pool. */
export const HASH_WORKER_POOL_SIZE = 2;

export interface UploadStatusConfig {
  label: string;
  tone: "default" | "accent" | "success" | "warning" | "danger" | "info" | "premium";
  icon: string;
}

export const UPLOAD_STATUS_CONFIG: Record<UploadStatus, UploadStatusConfig> = {
  queued: { label: "في الانتظار", tone: "default", icon: "Clock" },
  preparing: { label: "تحضير", tone: "info", icon: "Loader" },
  uploading: { label: "جارٍ الرفع", tone: "accent", icon: "ArrowUp" },
  paused: { label: "متوقف مؤقتاً", tone: "warning", icon: "Pause" },
  processing: { label: "معالجة", tone: "info", icon: "RefreshCw" },
  completed: { label: "اكتمل", tone: "success", icon: "CheckCircle2" },
  failed: { label: "فشل", tone: "danger", icon: "XCircle" },
  cancelled: { label: "ملغى", tone: "default", icon: "Ban" },
  retrying: { label: "إعادة المحاولة", tone: "warning", icon: "RotateCw" },
  recovering: { label: "استرداد", tone: "info", icon: "History" },
};

/** Number of items rendered above/below the viewport in the virtualized queue. */
export const UPLOAD_QUEUE_OVERSCAN = 6;

/** Fixed row height (px) used by the virtualized list. */
export const UPLOAD_QUEUE_ROW_HEIGHT = 92;

/** Collapsed launcher badge count cap. */
export const UPLOAD_LAUNCHER_COUNT_CAP = 99;

export interface ConnectionQualityConfig {
  label: string;
  tone: "default" | "success" | "warning" | "danger" | "info";
  /** Signal bars (0-4) used by the indicator. */
  bars: number;
}

export const CONNECTION_QUALITY_CONFIG: Record<ConnectionQuality, ConnectionQualityConfig> = {
  offline: { label: "غير متصل", tone: "danger", bars: 0 },
  poor: { label: "اتصال ضعيف", tone: "danger", bars: 1 },
  moderate: { label: "اتصال متوسط", tone: "warning", bars: 2 },
  good: { label: "اتصال جيد", tone: "success", bars: 3 },
  excellent: { label: "اتصال ممتاز", tone: "success", bars: 4 },
  unknown: { label: "جارٍ القياس", tone: "default", bars: 2 },
};
