import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { hashPool } from "./hashPool";

/**
 * Regression guard for the "upload freezes after the first concurrency wave"
 * production defect. The engine awaits `hashPool.hash(blob)` BEFORE dispatching
 * every chunk, so a hashing worker that never responds used to leave that
 * promise pending forever -- freezing the whole upload wave (the backend keeps
 * only the first `concurrency` chunks; nothing else ever arrives and the item
 * appears stuck with a ballooning ETA).
 *
 * These tests prove `hash()` no longer hangs: a non-responsive worker falls
 * back to main-thread hashing and marks the pool unusable for later calls.
 */

/** 4x 0xab byte array -> hex used by the main-thread fallback. */
const FALLBACK_HEX = "abababab";

type AnyWorker = {
  onmessage: ((e: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  postMessage: (data: unknown) => void;
  terminate: () => void;
};

class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

let fakeWorkers: FakeWorker[] = [];

function setHashPoolWorkers(count: number): void {
  fakeWorkers = Array.from({ length: count }, () => new FakeWorker());
  (hashPool as unknown as { workers: AnyWorker[] }).workers = fakeWorkers;
  (hashPool as unknown as { workersUsable: boolean }).workersUsable = count > 0;
  (hashPool as unknown as { initialized: boolean }).initialized = true;
  (hashPool as unknown as { next: number }).next = 0;
}

beforeEach(() => {
  vi.useFakeTimers();

  // Browser-like surface for the worker branch of hash(), while keeping the
  // main-thread fallback deterministic.
  vi.stubGlobal("window", {});
  vi.stubGlobal("crypto", {
    subtle: {
      digest: async () => new Uint8Array([0xab, 0xab, 0xab, 0xab]),
    },
  } as unknown as Crypto);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  (hashPool as unknown as { pending: Map<string, never> }).pending.clear();
});

describe("hashPool non-responsive worker handling", () => {
  it("falls back to the main thread instead of hanging when a worker never responds", async () => {
    setHashPoolWorkers(2);

    // dispatch a hash; the worker is handed the message but never replies
    const promise = hashPool.hash(new Blob(["x"]));

    // Advance past the hash timeout while the request is still in flight.
    await vi.advanceTimersByTimeAsync(20_000);

    // The promise must settle (fallback digest), not hang.
    const result = await Promise.race([
      promise,
      new Promise<"STILL_PENDING">((res) => void res("STILL_PENDING")),
    ]);

    expect(result).toBe(FALLBACK_HEX);
  });

  it("disables the worker pool after a timeout so later hashes avoid the dead workers", async () => {
    setHashPoolWorkers(1);

    const promise = hashPool.hash(new Blob(["a"]));
    await vi.advanceTimersByTimeAsync(20_000);
    await promise;

    expect((hashPool as unknown as { workersUsable: boolean }).workersUsable).toBe(false);
  });

  it("resolves via the worker normally and clears the pending entry", async () => {
    setHashPoolWorkers(1);

    const promise = hashPool.hash(new Blob(["b"]));

    // The worker responds right away. Route the response through the pool's
    // message handler with the real pending request id so it matches (and clears
    // the dangling timeout).
    await Promise.resolve();
    const pendingId = [...(hashPool as unknown as { pending: Map<string, unknown> }).pending.keys()][0]!;
    (hashPool as unknown as { onMessage: (d: { id: string; ok: boolean; hash?: string }) => void }).onMessage({
      id: pendingId,
      ok: true,
      hash: FALLBACK_HEX,
    });

    await expect(promise).resolves.toBe(FALLBACK_HEX);
    // A normal response leaves no dangling timeout/pending entry.
    expect((hashPool as unknown as { pending: Map<string, never> }).pending.size).toBe(0);
  });
});
