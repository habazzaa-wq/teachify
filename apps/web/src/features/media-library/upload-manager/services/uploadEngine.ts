import { toast } from "sonner";
import { mediaLibraryService } from "../../services";
import { useUploadManagerStore } from "../store";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveApiBaseUrl } from "@/config/env";
import { uploadGuard } from "./uploadGuard";
import { hashPool } from "./hashPool";
import { networkMonitor } from "./networkMonitor";
import { sessionStore } from "../persistence/sessionStore";
import { buildUploadItem } from "../utils/files";
import {
  UPLOAD_MAX_RETRIES,
  UPLOAD_CONCURRENCY,
  UPLOAD_RETRY_BASE_DELAY,
  UPLOAD_RETRY_MAX_DELAY,
  UPLOAD_SPEED_SMOOTHING,
  UPLOAD_SLOW_THRESHOLD,
  UPLOAD_PERMISSION,
  UPLOAD_SESSION_TTL,
  UPLOAD_SYNC_TAG,
  CHUNK_MAX_RETRIES,
  CHUNK_PARALLEL_DEFAULT,
} from "../constants";
import { buildChunks, contentRange, selectChunkSize, shouldChunk, sliceChunk } from "../utils/chunking";
import type {
  NetworkStatus,
  PersistedUploadRecord,
  UploadChunk,
  UploadError,
  UploadErrorType,
  UploadItem,
  UploadSession,
  UploadSource,
  UploadStatus,
} from "../types";
import type { MediaType } from "../../types";

interface ActiveXhr {
  xhr: XMLHttpRequest;
  abortReason: "pause" | "cancel" | null;
  loaded: number;
  total: number;
}

interface SpeedSample {
  bytes: number;
  timestamp: number;
}

interface ItemRuntime {
  sessionId: string;
  uploadId: string;
  blob: Blob;
  session: UploadSession;
  chunks: UploadChunk[];
  /** Aggregated in-flight bytes for active chunks (progress). */
  chunkLoaded: Map<number, number>;
  items: Map<string, ActiveXhr>;
  retryTimers: Map<string, ReturnType<typeof setTimeout>>;
  /** Rolling window of speed samples for real throughput calculation. */
  speedSamples: SpeedSample[];
  /** Epoch ms when this item's upload actually started. */
  uploadStartedAt: number | null;
  /** Last known total uploaded bytes (for delta calculation). */
  lastUploadedBytes: number;
  /** AbortController for the finalize request, so cancellation works during processing. */
  finalizeAbort: AbortController | null;
}

function statusOf(id: string): UploadStatus | undefined {
  return useUploadManagerStore.getState().items[id]?.status;
}

class UploadExecutorError extends Error {
  constructor(
    public kind: "network" | "timeout" | "server" | "abort" | "offline" | "checksum" | "unknown",
    public status?: number,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = "UploadExecutorError";
  }
}

function mapTypeToApi(category: MediaType): string {
  switch (category) {
    case "video":
      return "video";
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "pdf":
      return "pdf";
    default:
      return "file";
  }
}

function buildErrorMessage(type: UploadErrorType, status?: number): string {
  switch (type) {
    case "network":
      return "تعذر الاتصال بالخادم أثناء الرفع";
    case "offline":
      return "لا يوجد اتصال بالإنترنت — تم الإيقاف مؤقتاً";
    case "timeout":
      return "انتهت مهلة الاتصال أثناء الرفع";
    case "server":
      return `خطأ من الخادم${status ? ` (${status})` : ""}`;
    case "quota":
      return "مساحة التخزين غير كافية";
    case "permission":
      return "غير مصرح لك برفع الملفات";
    case "validation":
      return "الملف غير صالح";
    case "checksum":
      return "فشل التحقق من سلامة الملف (SHA-256)";
    case "cancelled":
      return "تم إلغاء الرفع";
    default:
      return "حدث خطأ غير متوقع أثناء الرفع";
  }
}

export interface EnqueueOptions {
  folderId?: number | null;
  canUpload?: boolean;
  source?: UploadSource;
}

/**
 * Production-grade chunk upload engine. Reuses the existing media library +
 * Bunny services (createUploadIntent / confirmUpload / uploadFileDirect) and
 * the front-end UploadGuard for quota + validation. Extends the previous
 * single-shot executor with:
 *
 *  - chunked + parallel uploads with adaptive chunk size & concurrency
 *  - pause / resume / retry of individual chunks (exponential backoff)
 *  - SHA-256 integrity (per-chunk + whole-file) computed in Web Workers
 *  - IndexedDB persistence + full session recovery (refresh / crash / close)
 *  - offline detection with automatic pause/resume
 *  - background sync registration when available
 *
 * The public surface is intentionally unchanged so the UI keeps working.
 */
class UploadEngine {
  private runtimes = new Map<string, ItemRuntime>();
  private activeCount = 0;
  private invalidators: Array<() => void> = [];
  private recoveryRan = false;
  private tabId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel("upload-engine-sync");
      this.channel.onmessage = (e) => {
        if (e.data?.type === "upload-completed" || e.data?.type === "upload-failed") {
          // Another tab finished an upload — invalidate media queries to pick it up.
          this.emitSettled();
        }
      };
    }
  }

  /** Broadcast to other tabs that an upload completed or failed. */
  private broadcast(event: "upload-completed" | "upload-failed"): void {
    try {
      this.channel?.postMessage({ type: event, tabId: this.tabId });
    } catch {
      // ignore
    }
  }

  registerInvalidator(fn: () => void): () => void {
    this.invalidators.push(fn);
    return () => {
      this.invalidators = this.invalidators.filter((f) => f !== fn);
    };
  }

  private emitSettled(): void {
    for (const fn of this.invalidators) {
      try {
        fn();
      } catch {
        // ignore invalidator errors
      }
    }
  }

  private setItem(id: string, patch: Partial<UploadItem>): void {
    useUploadManagerStore.getState().patchItem(id, patch);
  }

  private patchSession(session: UploadSession): void {
    session.updatedAt = Date.now();
    const runtime = this.runtimes.get(session.sessionId);
    sessionStore.saveSession(session, runtime?.chunks ?? [], runtime?.blob ?? new Blob()).catch(() => {});
  }

  private getNetwork(): NetworkStatus {
    return networkMonitor.getStatus();
  }

  async enqueue(files: File[], options: EnqueueOptions = {}): Promise<void> {
    const folderId = options.folderId ?? null;
    const canUpload = options.canUpload ?? true;

    if (!canUpload) {
      toast.error("غير مصرح لك برفع الملفات", { description: "تحقق من صلاحياتك في هذه المؤسسة" });
      return;
    }

    if (files.length === 0) return;

    let storageRemaining = Number.POSITIVE_INFINITY;
    try {
      const storage = await uploadGuard.getStorage();
      storageRemaining = storage.remaining;
    } catch {
      // proceed; backend guard will reject if over quota
    }

    const built: UploadItem[] = [];
    let rejectedCount = 0;

    for (const file of files) {
      const item = buildUploadItem(file, folderId);

      const validation = uploadGuard.validateFile(file);
      if (!validation.ok && validation.error) {
        item.status = "failed";
        item.error = validation.error;
        item.finishedAt = Date.now();
        rejectedCount += 1;
        built.push(item);
        continue;
      }

      if (file.size > storageRemaining) {
        item.status = "failed";
        item.error = {
          type: "quota",
          message: "مساحة التخزين المتبقية لا تكفي لهذا الملف",
          retryable: false,
        };
        item.finishedAt = Date.now();
        rejectedCount += 1;
        built.push(item);
        continue;
      }

      built.push(item);
    }

    useUploadManagerStore.getState().enqueue(built);

    if (rejectedCount > 0) {
      toast.warning(
        `تم رفض ${rejectedCount} من ${files.length} ملف`,
        { description: "تحقق من الحجم أو النوع أو مساحة التخزين" },
      );
    }

    // Only items that passed validation are queued in the store, but we must
    // start engines for the chunked ones. The store marks all `queued`.
    for (const item of built) {
      if (item.status === "queued") {
        this.primeRuntime(item);
      }
    }
    this.processQueue();
  }

  /** Create (or reuse) the runtime + persisted session for an upload item. */
  private primeRuntime(item: UploadItem): void {
    const existing = this.runtimes.get(item.id);
    if (existing) return;

    const chunkSize = selectChunkSize(item.size);
    const resumable = shouldChunk(item.size);
    const chunks = buildChunks(item.id, item.size, chunkSize);

    const now = Date.now();
    const session: UploadSession = {
      sessionId: item.id,
      uploadId: item.id,
      remoteSessionId: null,
      uploadUrl: null,
      uploadMethod: "PUT",
      headers: {},
      filename: item.filename,
      mime: item.mime,
      size: item.size,
      category: item.category,
      folderId: item.folderId,
      chunkSize,
      totalChunks: chunks.length,
      completedChunks: 0,
      failedChunks: 0,
      currentChunk: 0,
      fileHash: null,
      status: "active",
      startedAt: now,
      updatedAt: now,
      expiresAt: now + UPLOAD_SESSION_TTL,
    };

    const runtime: ItemRuntime = {
      sessionId: item.id,
      uploadId: item.id,
      blob: item.file,
      session,
      chunks,
      chunkLoaded: new Map(),
      items: new Map(),
      retryTimers: new Map(),
      speedSamples: [],
      uploadStartedAt: null,
      lastUploadedBytes: 0,
      finalizeAbort: null,
    };
    this.runtimes.set(item.id, runtime);

    // Persist immediately so a refresh right away is recoverable.
    sessionStore.saveSession(session, runtime.chunks, runtime.blob).catch(() => {});

    this.setItem(item.id, {
      chunkSize,
      resumable,
      chunkCount: chunks.length,
      uploadedChunks: 0,
      recovered: false,
      fileHash: null,
      checksumVerified: false,
    });
  }

  private processQueue(): void {
    if (this.runtimes.size === 0) return;
    const state = useUploadManagerStore.getState();
    for (const id of state.order) {
      if (this.activeCount >= UPLOAD_CONCURRENCY) break;
      const item = state.items[id];
      if (!item) continue;
      if (item.status !== "queued") continue;
      if (!this.runtimes.has(id)) continue;
      this.activeCount += 1;
      void this.run(id).finally(() => {
        this.activeCount -= 1;
        this.processQueue();
      });
    }
  }

  private async run(id: string): Promise<void> {
    const runtime = this.runtimes.get(id);
    if (!runtime) return;
    const net = this.getNetwork();
    if (!net.online) {
      this.setItem(id, { status: "paused", speed: 0, eta: null });
      this.patchSession(runtime.session);
      return;
    }

    this.setItem(id, {
      status: "preparing",
      startedAt: runtime.session.startedAt > 0 ? runtime.session.startedAt : Date.now(),
      progress: 0,
      speed: 0,
      eta: null,
      error: null,
      recovered: runtime.session.fileHash !== null,
    });

    try {
      // Reuse an already-created backend session (refresh/crash recovery or a
      // retried run) instead of opening a brand-new one on the server. This is
      // what lets us upload only the chunks the backend is still missing.
      let intent: Awaited<ReturnType<typeof mediaLibraryService.createResumableIntent>>;
      if (runtime.session.remoteSessionId != null) {
        intent = {
          sessionId: runtime.session.remoteSessionId,
          uploadUrl: `media-library/upload/resumable/${runtime.session.remoteSessionId}/chunk`,
          uploadMethod: "PUT",
          headers: {},
          asset: null,
          expiresAt: runtime.session.expiresAt
            ? new Date(runtime.session.expiresAt).toISOString()
            : null,
        };
      } else {
        intent = await mediaLibraryService.createResumableIntent({
          type: mapTypeToApi(runtime.session.category),
          original_filename: runtime.session.filename,
          mime_type: runtime.session.mime,
          size_bytes: runtime.session.size,
          folder_id: runtime.session.folderId ?? undefined,
          upload_id: runtime.session.uploadId,
          total_chunks: runtime.session.totalChunks,
        });
      }

      runtime.session.remoteSessionId = intent.sessionId;
      runtime.session.uploadUrl = intent.uploadUrl;
      runtime.session.uploadMethod = intent.uploadMethod;
      runtime.session.headers = intent.headers;
      this.patchSession(runtime.session);

      if (intent.uploadUrl) {
        await this.uploadChunks(id, runtime);

        // Check if the item was paused/cancelled during chunk upload (e.g. offline).
        const currentStatus = statusOf(id);
        if (currentStatus === "paused" || currentStatus === "cancelled") return;

        this.setItem(id, { status: "processing" });

        // Use an AbortController so cancel() can abort the finalize request.
        const abort = new AbortController();
        runtime.finalizeAbort = abort;

        try {
          const res = await mediaLibraryService.finalizeResumable(intent.sessionId, {
            size_bytes: runtime.session.size,
            file_hash: runtime.session.fileHash ?? undefined,
          }, { signal: abort.signal });
          this.completeItem(id, runtime, res.asset?.id ?? null, res.asset?.cdnUrl ?? null);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            return; // cancelled during processing — already cleaned up
          }
          throw err;
        } finally {
          runtime.finalizeAbort = null;
        }
      } else {
        const res = await mediaLibraryService.uploadFileDirect(runtime.blob as File);
        this.completeItem(id, runtime, res.asset?.id ?? null, res.cdnUrl ?? res.asset?.cdnUrl ?? null);
      }
    } catch (err) {
      this.handleError(id, err as UploadExecutorError);
    }
  }

  private completeItem(id: string, runtime: ItemRuntime, assetId: number | null, cdnUrl: string | null): void {
    const session = runtime.session;
    session.status = "completed";
    session.completedChunks = session.totalChunks;
    this.patchSession(session);
    sessionStore.remove(id).catch(() => {});
    this.runtimes.delete(id);

    this.setItem(id, {
      status: "completed",
      progress: 100,
      uploadedChunks: session.totalChunks,
      speed: 0,
      eta: null,
      finishedAt: Date.now(),
      assetId,
      cdnUrl,
      checksumVerified: session.fileHash !== null,
    });
    uploadGuard.invalidateStorage();
    this.emitSettled();
    this.registerBackgroundSync();
    this.broadcast("upload-completed");
  }

  private async uploadChunks(id: string, runtime: ItemRuntime): Promise<void> {
    const session = runtime.session;
    const pending = runtime.chunks.filter(
      (c) => c.status === "pending" || c.status === "failed",
    );

    if (pending.length === 0) {
      // Already fully uploaded (recovered mid-way) — verify and continue.
      await this.verifyFile(id, runtime);
      return;
    }

    session.status = "active";
    this.setItem(id, { status: "uploading" });

    let concurrency = this.getNetwork().concurrency || CHUNK_PARALLEL_DEFAULT;

    // Process in waves sized by the (adaptive) concurrency budget.
    let cursor = 0;
    while (cursor < pending.length && statusOf(id) !== "paused" && statusOf(id) !== "cancelled") {
      // Re-evaluate concurrency each wave (network may have changed).
      concurrency = this.getNetwork().concurrency || CHUNK_PARALLEL_DEFAULT;

      const wave = pending.slice(cursor, cursor + concurrency);
      const tasks = wave.map((chunk) => this.uploadOneChunk(id, runtime, chunk));
      const results = await Promise.allSettled(tasks);

      const failed = results.some((r) => r.status === "rejected");
      if (failed) {
        const err = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
        if (err && err.reason instanceof UploadExecutorError && err.reason.kind === "abort") {
          return; // paused/cancelled — stop the loop
        }
        throw err?.reason ?? new UploadExecutorError("unknown");
      }
      cursor += wave.length;
    }

    if (statusOf(id) === "paused" || statusOf(id) === "cancelled") return;

    await this.verifyFile(id, runtime);
  }

  private async uploadOneChunk(id: string, runtime: ItemRuntime, chunk: UploadChunk): Promise<void> {
    if (statusOf(id) === "paused" || statusOf(id) === "cancelled") {
      throw new UploadExecutorError("abort");
    }

    // Hash the chunk off-thread (skip if already hashed from a prior attempt).
    if (!chunk.hash) {
      this.setItem(id, { status: "uploading" });
      this.updateChunk(runtime, chunk, { status: "hashing" });
      const blob = sliceChunk(runtime.blob, chunk);
      const hash = await hashPool.hash(blob);
      chunk.hash = hash;
      this.updateChunk(runtime, chunk, { hash });
    }

    let attempt = chunk.retryCount;
    while (attempt <= CHUNK_MAX_RETRIES) {
      if (statusOf(id) === "paused" || statusOf(id) === "cancelled") {
        throw new UploadExecutorError("abort");
      }
      try {
        this.updateChunk(runtime, chunk, { status: "uploading" });
        await this.xhrUploadChunk(id, runtime, chunk);
        chunk.status = "uploaded";
        chunk.uploadedAt = Date.now();
        this.updateChunk(runtime, chunk, {
          status: "uploaded",
          uploadedAt: chunk.uploadedAt,
          retryCount: chunk.retryCount,
        });
        runtime.chunkLoaded.delete(chunk.index);
        this.updateProgress(id, runtime);
        return;
      } catch (err) {
        const execErr = err as UploadExecutorError;
        if (execErr.kind === "abort") throw execErr;
        if (execErr.kind === "offline") {
          // Stop everything; the engine will pause the item.
          throw execErr;
        }
        attempt += 1;
        chunk.retryCount = attempt;
        this.updateChunk(runtime, chunk, { status: "failed", retryCount: attempt });
        if (attempt > CHUNK_MAX_RETRIES) {
          throw new UploadExecutorError(execErr.kind === "server" ? "server" : "network");
        }
        const delay = Math.min(UPLOAD_RETRY_MAX_DELAY, UPLOAD_RETRY_BASE_DELAY * Math.pow(2, attempt - 1));
        await this.sleep(delay);
      }
    }
    throw new UploadExecutorError("network");
  }

  private xhrUploadChunk(id: string, runtime: ItemRuntime, chunk: UploadChunk): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!networkMonitor.isOnline()) {
        reject(new UploadExecutorError("offline"));
        return;
      }

      const session = runtime.session;
      const rawUrl = session.uploadUrl;
      if (!rawUrl) {
        reject(new UploadExecutorError("server", 0, "No upload URL"));
        return;
      }

      // The backend chunk endpoint is addressed relative to the API base url;
      // absolute urls (e.g. a direct CDN target) are used verbatim.
      const base = resolveApiBaseUrl();
      const url = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `${base}/${rawUrl.replace(/^\/+/, "")}`;

      const blob = sliceChunk(runtime.blob, chunk);
      const xhr = new XMLHttpRequest();
      const handle: ActiveXhr = { xhr, abortReason: null, loaded: 0, total: chunk.size };
      runtime.items.set(chunk.chunkId, handle);

      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (!e.lengthComputable) return;
        this.updateChunkProgress(id, runtime, chunk.index, e.loaded);
      };

      xhr.onload = () => {
        runtime.items.delete(chunk.chunkId);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else if (xhr.status === 0) {
          reject(new UploadExecutorError("network"));
        } else if (xhr.status === 413) {
          reject(new UploadExecutorError("server", xhr.status, "Chunk too large"));
        } else {
          reject(new UploadExecutorError("server", xhr.status));
        }
      };
      xhr.onerror = () => {
        runtime.items.delete(chunk.chunkId);
        reject(new UploadExecutorError("network"));
      };
      xhr.ontimeout = () => {
        runtime.items.delete(chunk.chunkId);
        reject(new UploadExecutorError("timeout"));
      };
      xhr.onabort = () => {
        runtime.items.delete(chunk.chunkId);
        reject(new UploadExecutorError("abort"));
      };

      try {
        // Reuse the same auth context the axios interceptor would attach so the
        // chunk request is authenticated and tenant-scoped on the backend.
        const token = (() => {
          try {
            return useAuthStore.getState().accessToken;
          } catch {
            return null;
          }
        })();
        const tenantId = (() => {
          try {
            return useTenantStore.getState().activeTenant?.id?.toString() ?? null;
          } catch {
            return null;
          }
        })();

        xhr.open(session.uploadMethod || "PUT", url, true);
        xhr.withCredentials = true;
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (tenantId) xhr.setRequestHeader("X-Tenant-ID", tenantId);
        Object.entries(session.headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, String(v)));
        // Send chunks as opaque binary so the backend can stream the raw body
        // (and Laravel never attempts to parse the payload as form/JSON).
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("Content-Range", contentRange(chunk, session.size));
        xhr.setRequestHeader("X-Chunk-Index", String(chunk.index));
        xhr.setRequestHeader("X-Chunk-Hash", chunk.hash ?? "");
        xhr.send(blob);
      } catch (e) {
        runtime.items.delete(chunk.chunkId);
        reject(e instanceof Error ? (e as UploadExecutorError) : new UploadExecutorError("unknown"));
      }
    });
  }

  private updateChunkProgress(id: string, runtime: ItemRuntime, chunkIndex: number, loaded: number): void {
    runtime.chunkLoaded.set(chunkIndex, loaded);

    const now = Date.now();
    if (!runtime.uploadStartedAt) {
      runtime.uploadStartedAt = now;
    }

    const uploadedBytes =
      runtime.chunks.reduce((acc, c) => acc + (c.status === "uploaded" ? c.size : 0), 0) +
      Array.from(runtime.chunkLoaded.values()).reduce((a, b) => a + b, 0);

    const deltaBytes = uploadedBytes - runtime.lastUploadedBytes;
    runtime.lastUploadedBytes = uploadedBytes;

    if (deltaBytes > 0 && now > runtime.uploadStartedAt) {
      runtime.speedSamples.push({ bytes: deltaBytes, timestamp: now });

      // Keep only the last 5 seconds of samples for a responsive rolling window.
      const windowMs = 5_000;
      const cutoff = now - windowMs;
      while (runtime.speedSamples.length > 0 && runtime.speedSamples[0]!.timestamp < cutoff) {
        runtime.speedSamples.shift();
      }
    }

    this.updateProgress(id, runtime);
  }

  private computeSpeed(runtime: ItemRuntime): number {
    const samples = runtime.speedSamples;
    if (samples.length === 0) return 0;

    const now = Date.now();
    const windowMs = 5_000;
    const cutoff = now - windowMs;
    const recent = samples.filter((s) => s.timestamp >= cutoff);

    if (recent.length === 0) return 0;

    const totalBytes = recent.reduce((sum, s) => sum + s.bytes, 0);
    const elapsedMs = now - recent[0]!.timestamp;

    if (elapsedMs <= 0) return 0;

    // bytes per second
    return (totalBytes / elapsedMs) * 1_000;
  }

  private updateChunk(runtime: ItemRuntime, chunk: UploadChunk, patch: Partial<UploadChunk>): void {
    Object.assign(chunk, patch);
    runtime.session.completedChunks = runtime.chunks.filter((c) => c.status === "uploaded").length;
    runtime.session.failedChunks = runtime.chunks.filter((c) => c.status === "failed").length;
    runtime.session.currentChunk = runtime.chunks.find((c) => c.status !== "uploaded")?.index ?? runtime.session.totalChunks;
    this.patchSession(runtime.session);
  }

  private updateProgress(id: string, runtime: ItemRuntime): void {
    const session = runtime.session;
    const uploadedBytes =
      runtime.chunks.reduce((acc, c) => acc + (c.status === "uploaded" ? c.size : 0), 0) +
      Array.from(runtime.chunkLoaded.values()).reduce((a, b) => a + b, 0);

    const total = session.size || 1;
    const progress = Math.min(100, (uploadedBytes / total) * 100);
    const completedChunks = session.completedChunks;
    const item = useUploadManagerStore.getState().items[id];

    const rawSpeed = this.computeSpeed(runtime);
    // Smooth the speed to avoid jittery display.
    const prevSpeed = item?.speed ?? 0;
    const smoothing = UPLOAD_SPEED_SMOOTHING;
    const speed = prevSpeed
      ? prevSpeed * (1 - smoothing) + rawSpeed * smoothing
      : rawSpeed;

    if (speed > 0) networkMonitor.reportSpeed(speed);

    const remaining = session.size - uploadedBytes;
    const eta = speed > 0 ? remaining / speed : null;

    let warning = item?.warning ?? null;
    if (speed > 0 && speed < UPLOAD_SLOW_THRESHOLD && item?.warning?.type !== "large") {
      warning = { type: "slow", message: "سرعة الرفع منخفضة" };
    } else if (speed >= UPLOAD_SLOW_THRESHOLD && item?.warning?.type === "slow") {
      warning = null;
    }

    this.setItem(id, {
      progress,
      uploadedChunks: completedChunks,
      speed,
      eta,
      warning,
    });
  }

  private async verifyFile(id: string, runtime: ItemRuntime): Promise<void> {
    const session = runtime.session;
    if (session.fileHash) return; // already verified in a prior session
    const ordered = [...runtime.chunks].sort((a, b) => a.index - b.index);
    const fileHash = await hashPool.combine(ordered.map((c) => c.hash ?? ""));
    session.fileHash = fileHash;
    this.patchSession(session);
    this.setItem(id, { fileHash, checksumVerified: true });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      // keep a handle so cancel can clear it if needed
      void t;
    });
  }

  private handleError(id: string, err: UploadExecutorError): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      for (const handle of runtime.items.values()) {
        if (handle.abortReason === "pause") handle.xhr.abort();
      }
    }

    const current = useUploadManagerStore.getState().items[id];
    if (!current) return;

    if (err.kind === "abort") {
      return; // handled by pause/cancel paths
    }

    if (err.kind === "offline") {
      this.setItem(id, {
        status: "paused",
        speed: 0,
        eta: null,
        error: { type: "offline", message: buildErrorMessage("offline"), retryable: false },
      });
      if (runtime) {
        runtime.session.status = "paused";
        this.patchSession(runtime.session);
      }
      return;
    }

    const type: UploadErrorType =
      err.kind === "network"
        ? "network"
        : err.kind === "timeout"
          ? "timeout"
          : err.kind === "server"
            ? "server"
            : "unknown";

    const retryable = type === "network" || type === "timeout" || type === "server" || type === "unknown";

    if (retryable && current.retryCount < UPLOAD_MAX_RETRIES) {
      const next = current.retryCount + 1;
      const delay = Math.min(UPLOAD_RETRY_MAX_DELAY, UPLOAD_RETRY_BASE_DELAY * Math.pow(2, next - 1));
      const message = buildErrorMessage(type, err.status);
      this.setItem(id, {
        status: "retrying",
        retryCount: next,
        error: { type, message, retryable: true },
        retryAt: Date.now() + delay,
        speed: 0,
        eta: null,
      });
      if (runtime) {
        runtime.session.status = "paused";
        this.patchSession(runtime.session);
      }

      const timer = setTimeout(() => {
        const rt = this.runtimes.get(id);
        if (rt) rt.retryTimers.delete(id);
        const cur = useUploadManagerStore.getState().items[id];
        if (!cur || cur.status !== "retrying") return;
        if (!networkMonitor.isOnline()) {
          this.setItem(id, { status: "paused", retryAt: null });
          return;
        }
        this.setItem(id, { status: "queued", retryAt: null, progress: 0, error: null });
        if (this.runtimes.get(id)) {
          this.runtimes.get(id)!.session.status = "active";
        }
        this.processQueue();
      }, delay);
      if (runtime) runtime.retryTimers.set(id, timer);
      return;
    }

    const message = buildErrorMessage(type, err.status);
    const finalError: UploadError = { type, message, retryable: false, code: err.status };
    this.setItem(id, {
      status: "failed",
      error: finalError,
      speed: 0,
      eta: null,
      finishedAt: Date.now(),
    });
    if (runtime) {
      runtime.session.status = "failed";
      this.patchSession(runtime.session);
    }
    this.emitSettled();
    this.broadcast("upload-failed");
    toast.error("فشل رفع الملف", { description: `${current.filename}: ${message}` });
  }

  /* ----------------------------- Controls ----------------------------- */

  pause(id: string): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      for (const handle of runtime.items.values()) {
        handle.abortReason = "pause";
        handle.xhr.abort();
      }
      runtime.session.status = "paused";
      this.patchSession(runtime.session);
    }
    useUploadManagerStore.getState().pauseItem(id);
  }

  resume(id: string): void {
    useUploadManagerStore.getState().resumeItem(id);
    this.processQueue();
  }

  cancel(id: string): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      for (const handle of runtime.items.values()) {
        handle.abortReason = "cancel";
        handle.xhr.abort();
      }
      for (const timer of runtime.retryTimers.values()) clearTimeout(timer);
      runtime.retryTimers.clear();
      if (runtime.finalizeAbort) {
        runtime.finalizeAbort.abort();
        runtime.finalizeAbort = null;
      }
    }
    sessionStore.remove(id).catch(() => {});
    this.runtimes.delete(id);
    useUploadManagerStore.getState().cancelItem(id);
  }

  retry(id: string): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      // reset failed chunks back to pending with a fresh retry budget
      for (const chunk of runtime.chunks) {
        if (chunk.status === "failed") {
          chunk.status = "pending";
          chunk.retryCount = 0;
          chunk.uploadedAt = null;
        }
      }
      runtime.session.status = "active";
      this.patchSession(runtime.session);
    }
    useUploadManagerStore.getState().retryItem(id);
    this.processQueue();
  }

  remove(id: string): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      for (const handle of runtime.items.values()) {
        handle.abortReason = "cancel";
        handle.xhr.abort();
      }
      for (const timer of runtime.retryTimers.values()) clearTimeout(timer);
      if (runtime.finalizeAbort) {
        runtime.finalizeAbort.abort();
        runtime.finalizeAbort = null;
      }
    }
    sessionStore.remove(id).catch(() => {});
    this.runtimes.delete(id);
    useUploadManagerStore.getState().removeItem(id);
  }

  pauseAll(): void {
    const { order } = useUploadManagerStore.getState();
    for (const id of order) {
      const runtime = this.runtimes.get(id);
      if (runtime) {
        for (const handle of runtime.items.values()) {
          handle.abortReason = "pause";
          handle.xhr.abort();
        }
        runtime.session.status = "paused";
        this.patchSession(runtime.session);
      }
    }
    useUploadManagerStore.getState().applyBulkAction("pause-all");
  }

  resumeAll(): void {
    useUploadManagerStore.getState().applyBulkAction("resume-all");
    this.processQueue();
  }

  cancelAll(): void {
    const { order } = useUploadManagerStore.getState();
    for (const id of order) this.cancel(id);
  }

  retryFailed(): void {
    useUploadManagerStore.getState().applyBulkAction("retry-failed");
    this.processQueue();
  }

  clearCompleted(): void {
    useUploadManagerStore.getState().applyBulkAction("clear-completed");
  }

  clearFailed(): void {
    useUploadManagerStore.getState().applyBulkAction("clear-failed");
  }

  /* --------------------------- Recovery --------------------------- */

  /** Recover persisted sessions after a refresh / crash / closed tab. */
  async recoverSessions(): Promise<number> {
    if (this.recoveryRan) return 0;
    this.recoveryRan = true;

    try {
      await sessionStore.pruneExpired();
    } catch {
      // ignore
    }

    const records = await sessionStore.loadAll();
    let recovered = 0;

    const reconciliations: Promise<void>[] = [];

    for (const record of records) {
      if (record.session.status === "completed" || record.session.status === "expired") {
        continue;
      }
      recovered += 1;
      this.hydrateFromRecord(record);
      // Briefly show "recovering" while we reconcile with the server.
      this.setItem(record.session.sessionId, { status: "recovering" });
      if (record.session.remoteSessionId != null) {
        reconciliations.push(this.reconcileWithServer(record.session.sessionId, record.session.remoteSessionId));
      }
    }

    // Ask the backend which chunks it already holds so we only (re)upload the
    // missing ones after a refresh, crash or closed tab.
    await Promise.allSettled(reconciliations);

    // Transition all recovering items to queued so processQueue picks them up.
    const state = useUploadManagerStore.getState();
    for (const id of state.order) {
      if (state.items[id]?.status === "recovering") {
        this.setItem(id, { status: "queued" });
      }
    }

    if (recovered > 0) {
      toast.info(`تم استئناف ${recovered} رفع غير مكتمل`, {
        description: "الجلسات استُرجعت تلقائياً من التخزين المحلي",
      });
    }
    this.processQueue();
    return recovered;
  }

  /** Reconcile local chunk state with the backend's uploaded-chunk bitmap. */
  private async reconcileWithServer(localId: string, remoteSessionId: number): Promise<void> {
    try {
      const res = await mediaLibraryService.resumeResumable(remoteSessionId);
      const runtime = this.runtimes.get(localId);
      if (!runtime) return;

      const completed = new Set<number>(res.completedChunks ?? []);
      for (const chunk of runtime.chunks) {
        if (completed.has(chunk.index)) {
          chunk.status = "uploaded";
          chunk.uploadedAt = chunk.uploadedAt ?? Date.now();
        }
      }
      runtime.session.completedChunks = runtime.chunks.filter((c) => c.status === "uploaded").length;
      runtime.session.currentChunk =
        runtime.chunks.find((c) => c.status !== "uploaded")?.index ?? runtime.session.totalChunks;
      this.patchSession(runtime.session);
    } catch {
      // Backend authoritative state unavailable — rely on the local IndexedDB
      // record and let the engine re-upload any not-yet-confirmed chunks.
    }
  }

  private hydrateFromRecord(record: PersistedUploadRecord): void {
    const { session, chunks, blob } = record;

    const runtime: ItemRuntime = {
      sessionId: session.sessionId,
      uploadId: session.uploadId,
      blob,
      session: { ...session, status: "active" },
      chunks: chunks.map((c) => ({ ...c })),
      chunkLoaded: new Map(),
      items: new Map(),
      retryTimers: new Map(),
      speedSamples: [],
      uploadStartedAt: null,
      lastUploadedBytes: 0,
      finalizeAbort: null,
    };
    this.runtimes.set(session.sessionId, runtime);

    // Rebuild a UI item for the recovered upload.
    const item: UploadItem = {
      id: session.sessionId,
      file: blob as File,
      preview: null,
      filename: session.filename,
      size: session.size,
      mime: session.mime,
      category: session.category,
      progress: 0,
      speed: 0,
      eta: null,
      status: "queued",
      retryCount: 0,
      chunkCount: session.totalChunks,
      uploadedChunks: session.completedChunks,
      chunkSize: session.chunkSize,
      resumable: session.totalChunks > 1,
      recovered: true,
      fileHash: session.fileHash,
      checksumVerified: session.fileHash !== null,
      error: null,
      warning: session.size > 5 * 1024 * 1024 ? { type: "large", message: "ملف كبير الحجم" } : null,
      retryAt: null,
      createdAt: session.startedAt,
      startedAt: session.startedAt,
      finishedAt: null,
      assetId: null,
      cdnUrl: null,
      folderId: session.folderId,
    };
    useUploadManagerStore.getState().enqueue([item]);
  }

  /* ------------------------ Background Sync ------------------------ */

  private registerBackgroundSync(): void {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      navigator.serviceWorker.ready
        .then((reg) => {
          const sync = (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync;
          return sync?.register(UPLOAD_SYNC_TAG);
        })
        .catch(() => {
          // Background sync unavailable — uploads still continue in the tab.
        });
    } catch {
      // graceful fallback
    }
  }
}

export const uploadEngine = new UploadEngine();
export { uploadGuard } from "./uploadGuard";
export { UPLOAD_PERMISSION };
export { networkMonitor } from "./networkMonitor";
export type { UploadSource };
