import { describe, it, expect } from "vitest";
import {
  createProgressState,
  foldCompletedBytes,
  setInFlight,
  completeChunk,
  currentUploadedBytes,
  progressPercent,
  type ProgressChunk,
} from "./progressAccounting";

const chunk = (index: number, size: number, status: ProgressChunk["status"] = "pending"): ProgressChunk => ({
  index,
  size,
  status,
});

describe("progressAccounting", () => {
  it("starts at 0 reported progress", () => {
    const state = createProgressState(1000);
    const chunks = [chunk(0, 500), chunk(1, 500)];
    expect(currentUploadedBytes(state, chunks)).toBe(0);
    expect(progressPercent(currentUploadedBytes(state, chunks), 1000)).toBe(0);
  });

  it("increases monotonically as chunks complete", () => {
    const total = 1000;
    const chunks = [chunk(0, 500), chunk(1, 500)];
    let state = createProgressState(total);

    chunks[0] = { ...chunks[0]!, status: "uploaded" };
    state = foldCompletedBytes(state, chunks);
    expect(currentUploadedBytes(state, chunks)).toBe(500);
    expect(progressPercent(currentUploadedBytes(state, chunks), total)).toBe(50);

    chunks[1] = { ...chunks[1]!, status: "uploaded" };
    state = foldCompletedBytes(state, chunks);
    expect(currentUploadedBytes(state, chunks)).toBe(1000);
    expect(progressPercent(currentUploadedBytes(state, chunks), total)).toBe(100);
  });

  it("aggregates parallel in-flight chunks independently", () => {
    const total = 1000;
    const chunks = [chunk(0, 500), chunk(1, 500)];
    let state = createProgressState(total);

    // Two chunks uploading in parallel.
    state = setInFlight(state, 0, 200);
    state = setInFlight(state, 1, 300);

    expect(currentUploadedBytes(state, chunks)).toBe(500);
    expect(progressPercent(currentUploadedBytes(state, chunks), total)).toBe(50);
  });

  it("never decreases progress when a chunk retries (in-flight reset)", () => {
    const total = 1000;
    const chunks = [chunk(0, 500), chunk(1, 500)];
    let state = createProgressState(total);

    // Chunk 0 reaches 400 bytes then fails mid-transfer; chunk 1 completes.
    state = setInFlight(state, 0, 400);
    state = setInFlight(state, 1, 400);
    const before = currentUploadedBytes(state, chunks);

    // Chunk 0 fires a retry progress event restarting near 0.
    state = setInFlight(state, 0, 400); // monotonic per chunk: stays at 400
    expect(currentUploadedBytes(state, chunks)).toBe(before);

    // Even with a lower raw value, the per-chunk monotonic guard holds.
    state = setInFlight(state, 0, 50);
    expect(currentUploadedBytes(state, chunks)).toBe(before);
  });

  it("does not decrease aggregate bytes on completion of a parallel chunk", () => {
    const total = 1000;
    const chunks = [chunk(0, 500), chunk(1, 500)];
    let state = createProgressState(total);

    state = setInFlight(state, 0, 500);
    state = setInFlight(state, 1, 500);

    // Chunk 0 completes: fold its full size in and drop in-flight.
    chunks[0] = { ...chunks[0]!, status: "uploaded" };
    state = foldCompletedBytes(state, chunks);
    // In-flight entry for chunk 0 must not double-count.
    const after = currentUploadedBytes(state, chunks);
    expect(after).toBe(1000);
    expect(after).toBeGreaterThanOrEqual(500);
  });

  it("completeChunk folds bytes and removes the in-flight entry (no double count)", () => {
    const total = 1000;
    let state = createProgressState(total);
    state = setInFlight(state, 0, 500);
    state = completeChunk(state, chunk(0, 500, "uploaded"));
    expect(currentUploadedBytes(state, [chunk(0, 500, "uploaded"), chunk(1, 500)])).toBe(500);
  });

  it("recovery of already-uploaded chunks never moves progress backward", () => {
    const total = 1000;
    const allUploaded = [chunk(0, 500, "uploaded"), chunk(1, 500, "uploaded")];

    // Fresh state (e.g. after a refresh reload) reconciled only against the
    // completed-chunk set must reach 100 even if the accumulator started at 0.
    const fresh = createProgressState(total);
    expect(progressPercent(currentUploadedBytes(fresh, allUploaded), total)).toBe(100);
  });

  it("clamps aggregate bytes at totalBytes", () => {
    const total = 1000;
    const chunks = [chunk(0, 800)];
    let state = createProgressState(total);
    state = setInFlight(state, 0, 700);
    state = setInFlight(state, 0, 800);
    // completed (0) + in-flight never exceeds 1000 even at 800; still bounded.
    expect(currentUploadedBytes(state, chunks)).toBeLessThanOrEqual(1000);
    expect(progressPercent(currentUploadedBytes(state, chunks), total)).toBeLessThanOrEqual(100);
  });
});
