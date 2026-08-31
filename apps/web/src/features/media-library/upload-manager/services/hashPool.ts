import { HASH_WORKER_POOL_SIZE } from "../constants";
import type { HashResponse } from "../workers/hash.worker";

/**
 * Round-robin pool of SHA-256 hashing workers with a main-thread fallback.
 * Callers get a promise resolving to the hex digest of a blob without ever
 * blocking the UI thread (unless workers are unavailable).
 */

interface Pending {
  resolve: (hash: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * If a hashing worker stops responding (crashed/terminated but its message
 * post went through, or a hung digest), the round-robin pool would otherwise
 * leave the caller hanging forever. That would freeze the upload engine's wave
 * loop: every uploadOneChunk awaits hashing BEFORE dispatching the chunk, so a
 * single never-resolving hash stalls the whole upload after the first
 * concurrency-sized wave (chunks in the backend session but no further
 * progress, item stuck "uploading", ETA balloons from near-zero speed).
 *
 * To keep uploads moving we cap each hash with a timeout; on expiry we reject
 * the pending hash (which falls back to main-thread hashing) and disable the
 * worker pool so subsequent hashes don't route back to the unresponsive worker.
 */
const HASH_TIMEOUT_MS = 20_000;

class HashPool {
  private workers: Worker[] = [];
  private pending = new Map<string, Pending>();
  private next = 0;
  private counter = 0;
  private initialized = false;
  private workersUsable = false;

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window === "undefined" || typeof Worker === "undefined") return;

    try {
      for (let i = 0; i < HASH_WORKER_POOL_SIZE; i += 1) {
        const worker = new Worker(new URL("../workers/hash.worker.ts", import.meta.url), {
          type: "module",
        });
        worker.onmessage = (event: MessageEvent<HashResponse>) => this.onMessage(event.data);
        worker.onerror = () => {
          // A worker crashed; disable the pool and fall back to main thread.
          this.workersUsable = false;
        };
        this.workers.push(worker);
      }
      this.workersUsable = this.workers.length > 0;
    } catch {
      this.workersUsable = false;
    }
  }

  private onMessage(data: HashResponse): void {
    const entry = this.pending.get(data.id);
    if (!entry) return;
    this.pending.delete(data.id);
    if (entry.timer) clearTimeout(entry.timer);
    if (data.ok) entry.resolve(data.hash);
    else {
      // A worker reported a real error — do not keep routing to it.
      this.workersUsable = false;
      entry.reject(new Error(data.error));
    }
  }

  private async hashOnMainThread(blob: Blob): Promise<string> {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new Error("SubtleCrypto unavailable");
    }
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const bytes = new Uint8Array(digest);
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) {
      out += bytes[i]!.toString(16).padStart(2, "0");
    }
    return out;
  }

  async hash(blob: Blob): Promise<string> {
    this.init();

    if (!this.workersUsable || this.workers.length === 0) {
      return this.hashOnMainThread(blob);
    }

    const worker = this.workers[this.next % this.workers.length]!;
    this.next += 1;
    this.counter += 1;
    const id = `h${this.counter.toString(36)}`;

    return new Promise<string>((resolve, reject) => {
      const entry: Pending = {
        resolve,
        reject,
        timer: setTimeout(() => {
          // The worker never replied. Release this hash and stop trusting the
          // pool so the upload can keep going instead of freezing the wave loop
          // forever. Compute the digest on the main thread as a graceful
          // fallback (matches the postMessage-throw fallback) so the chunk wave
          // proceeds without a stall or a spurious retry.
          if (this.pending.get(id)) this.pending.delete(id);
          this.workersUsable = false;
          this.hashOnMainThread(blob).then(resolve).catch(reject);
        }, HASH_TIMEOUT_MS),
      };
      this.pending.set(id, entry);
      try {
        worker.postMessage({ id, blob });
      } catch {
        if (entry.timer) clearTimeout(entry.timer);
        this.pending.delete(id);
        // Fall back if the message can't be posted (e.g. detached blob).
        this.hashOnMainThread(blob).then(resolve).catch(reject);
      }
    });
  }

  /** Combine ordered chunk digests into one file-level digest. */
  async combine(chunkHashes: string[]): Promise<string> {
    const encoder = new TextEncoder();
    const blob = new Blob([encoder.encode(chunkHashes.join(""))]);
    return this.hash(blob);
  }

  dispose(): void {
    for (const worker of this.workers) {
      try {
        worker.terminate();
      } catch {
        // ignore
      }
    }
    for (const entry of this.pending.values()) {
      if (entry.timer) clearTimeout(entry.timer);
    }
    this.workers = [];
    this.pending.clear();
    this.initialized = false;
    this.workersUsable = false;
  }
}

export const hashPool = new HashPool();
