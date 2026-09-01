/**
 * Pure, unit-testable progress accounting for the resumable upload engine.
 *
 * The invariant we guarantee here is MONOTONICITY: within a single upload
 * attempt (and across chunk retries / recovery of the same session) the
 * reported progress must never decrease. That guarantee comes from correct
 * byte accounting, not from clamping the displayed number:
 *
 *   uploadedBytes = sum(fully-uploaded chunk bytes) + sum(in-flight bytes)
 *
 * where
 *  - fully-uploaded chunk bytes live in a monotonic accumulator that only
 *    ever grows (reconciled against the completed chunk set), and
 *  - in-flight bytes are monotonic PER CHUNK: a retry of the same chunk can
 *    never report less than what it had already transferred.
 *
 * Parallel chunks contribute independently (their in-flight bytes are keyed
 * by chunk index) so they never overwrite each other's progress.
 */

export interface ProgressChunk {
  index: number;
  size: number;
  status: "pending" | "hashing" | "uploading" | "uploaded" | "failed";
}

export interface ProgressState {
  /** Monotonic count of fully-uploaded bytes. Only ever grows. */
  completedBytes: number;
  /** In-flight loaded bytes per chunk index (monotonic per chunk). */
  inFlight: Map<number, number>;
  /** Total file size in bytes. */
  totalBytes: number;
}

export function createProgressState(totalBytes: number): ProgressState {
  return { completedBytes: 0, inFlight: new Map(), totalBytes };
}

/** Sum of the sizes of chunks currently marked "uploaded". */
export function sumCompletedChunkBytes(chunks: ProgressChunk[]): number {
  let total = 0;
  for (const chunk of chunks) {
    if (chunk.status === "uploaded") total += chunk.size;
  }
  return total;
}

/**
 * Fold completed chunks into the monotonic accumulator. Never subtracts:
 * the accumulator is reconciled upward to the completed-chunk sum so that
 * recovery/retry of an already-uploaded set cannot move progress backward.
 */
export function foldCompletedBytes(state: ProgressState, chunks: ProgressChunk[]): ProgressState {
  const completed = sumCompletedChunkBytes(chunks);
  return {
    ...state,
    completedBytes: Math.max(state.completedBytes, completed),
  };
}

/**
 * Record in-flight bytes for a chunk, monotonic per chunk index. A retry of
 * the same chunk re-reports bytes already transferred and can only move the
 * in-flight contribution upward, never downward.
 */
export function setInFlight(state: ProgressState, index: number, loaded: number): ProgressState {
  const prev = state.inFlight.get(index) ?? 0;
  const next = new Map(state.inFlight);
  next.set(index, Math.max(prev, loaded));
  return { ...state, inFlight: next };
}

/**
 * Fold a just-completed chunk into the monotonic accumulator and drop its
 * in-flight entry so it is not double-counted.
 */
export function completeChunk(state: ProgressState, chunk: ProgressChunk): ProgressState {
  const inFlight = new Map(state.inFlight);
  inFlight.delete(chunk.index);
  return { ...state, completedBytes: state.completedBytes + chunk.size, inFlight };
}

/**
 * Aggregate uploaded bytes = monotonic completed bytes + in-flight bytes of
 * chunks that are not yet complete. Never exceeds totalBytes.
 */
export function currentUploadedBytes(state: ProgressState, chunks: ProgressChunk[]): number {
  const folded = foldCompletedBytes(state, chunks);
  let inFlightBytes = 0;
  for (const [index, loaded] of folded.inFlight) {
    const chunk = chunks.find((c) => c.index === index);
    // Only count in-flight bytes for a chunk not yet considered complete.
    if (chunk && chunk.status !== "uploaded") inFlightBytes += loaded;
  }
  return Math.min(folded.totalBytes, folded.completedBytes + inFlightBytes);
}

/** 0-100 percentage, bounded to [0,100]. */
export function progressPercent(uploadedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0;
  return Math.min(100, (uploadedBytes / totalBytes) * 100);
}

/**
 * Bound an estimated seconds-remaining figure so a slow-but-active link never
 * fabricates a ballooning multi-hour/day countdown. Estimates beyond `maxSeconds`
 * (or undefined/negative/non-finite) are reported as null ("unknown"), which the
 * UI renders as "—".
 */
export function boundEta(rawEtaSeconds: number | null, maxSeconds: number): number | null {
  if (rawEtaSeconds === null || !Number.isFinite(rawEtaSeconds) || rawEtaSeconds < 0) return null;
  if (rawEtaSeconds > maxSeconds) return null;
  return rawEtaSeconds;
}
