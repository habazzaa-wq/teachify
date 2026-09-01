import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadManagerStore } from "../store";
import { uploadEngine } from "./uploadEngine";

/**
 * Regression guards for the chunk-transport idle watchdog (issue: uploads are
 * killed on slow/flaky VPNs).
 *
 * The old transport used `XMLHttpRequest.timeout = 120_000`, which the browser
 * enforces as an ABSOLUTE deadline from send(): it fires even while the body is
 * still streaming. On a slow VPN a 2-4MB chunk legally takes longer than 2
 * minutes to move, so every chunk was aborted mid-transfer, its in-flight bytes
 * reset (progress visibly jumped BACKWARDS), retries re-burned the same 120s
 * deadline, and the item ultimately hard-failed with "إعادة المحاولة".
 *
 * The fix uses an IDLE watchdog: a chunk is only aborted when it makes no
 * forward progress for CHUNK_IDLE_TIMEOUT_MS, and a stall-abort surfaces as a
 * RETRYABLE "timeout" error (uploadOneChunk retries the SAME chunk with its
 * monotonic in-flight bytes preserved), never as a terminal "abort".
 */

type AnyXhr = {
  upload: {
    onprogress: ((e: { lengthComputable: boolean; loaded: number }) => void) | null;
    onloadstart: (() => void) | null;
  };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  onabort: (() => void) | null;
  abort: () => void;
  aborted: boolean;
  status: number;
  withCredentials: boolean;
  timeout: number;
  open: (method: string, url: string) => void;
  setRequestHeader: (k: string, v: string) => void;
  send: (body: unknown) => void;
  emitProgress: (loaded: number) => void;
};

function makeFakeXhr(): AnyXhr {
  const xhr: AnyXhr = {
    upload: { onprogress: null, onloadstart: null },
    onload: null,
    onerror: null,
    ontimeout: null,
    onabort: null,
    aborted: false,
    status: 0,
    withCredentials: false,
    timeout: 0,
    open() {},
    setRequestHeader() {},
    send() {
      xhr.upload.onloadstart?.();
    },
    abort() {
      xhr.aborted = true;
      xhr.onabort?.();
    },
    emitProgress(loaded: number) {
      xhr.upload.onprogress?.({ lengthComputable: true, loaded });
    },
  };
  return xhr;
}

let fakeXhr: AnyXhr;

const chunk = {
  chunkId: "c0",
  uploadId: "u0",
  index: 0,
  offset: 0,
  size: 1_024,
  hash: "h",
  status: "uploading" as const,
  retryCount: 0,
  uploadedAt: null,
};

const session = {
  sessionId: "s0",
  uploadId: "u0",
  remoteSessionId: 1,
  uploadUrl: "http://cdn.test/chunk",
  uploadMethod: "PUT",
  headers: {} as Record<string, string>,
  filename: "a.mp4",
  mime: "video/mp4",
  size: 2_000_000,
  category: "video" as const,
  folderId: null,
  chunkSize: 1_024,
  totalChunks: 2,
  completedChunks: 0,
  failedChunks: 0,
  currentChunk: 0,
  fileHash: null,
  status: "active" as const,
  startedAt: 1_000,
  updatedAt: 1_000,
  expiresAt: 10_000,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRuntime(chunka: unknown = chunk): any {
  return {
    sessionId: "s0",
    uploadId: "u0",
    blob: new Blob([new Uint8Array(1_024)]),
    session,
    chunks: [chunka],
    chunkLoaded: new Map<number, number>(),
    items: new Map<string, { xhr: AnyXhr }>(),
    retryTimers: new Map<string, ReturnType<typeof setTimeout>>(),
    speedSamples: [] as { bytes: number; timestamp: number }[],
    uploadStartedAt: 1_000,
    lastUploadedBytes: 0,
    uploadedBytes: 0,
    finalizeAbort: null,
  };
}

function driveChunk(runtime: ReturnType<typeof makeRuntime>): Promise<void> {
  return uploadEngine["xhrUploadChunk"]("u0", runtime, chunk) as Promise<void>;
}

beforeEach(() => {
  vi.useFakeTimers();
  useUploadManagerStore.setState({
    items: {
      u0: {
        id: "u0",
        file: new File(["x"], "a.mp4"),
        preview: null,
        filename: "a.mp4",
        size: 2_000_000,
        mime: "video/mp4",
        category: "video",
        progress: 0,
        speed: 0,
        eta: null,
        status: "uploading",
        retryCount: 0,
        chunkCount: 2,
        uploadedChunks: 0,
        chunkSize: 1_024,
        resumable: true,
        recovered: false,
        fileHash: null,
        checksumVerified: false,
        error: null,
        warning: null,
        retryAt: null,
        createdAt: 1_000,
        startedAt: null,
        finishedAt: null,
        assetId: null,
        cdnUrl: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  });

  vi.stubGlobal("XMLHttpRequest", function XMLHttpRequest() {
    fakeXhr = makeFakeXhr();
    return fakeXhr;
  } as unknown as typeof XMLHttpRequest);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useUploadManagerStore.setState({ items: {} });
});

describe("chunk transport idle watchdog", () => {
  it("never aborts a slow-but-progressing chunk past the old 120s deadline", async () => {
    const runtime = makeRuntime();
    const p = driveChunk(runtime);

    let settled = false;
    p.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    void runtime;

    // A progress event every 20s for 240 simulated seconds — an absolute
    // 120s XHR timeout would have killed the transfer at t=120.
    for (let tick = 0; tick < 12; tick += 1) {
      await vi.advanceTimersByTimeAsync(20_000);
      fakeXhr.emitProgress((tick + 1) * 256);
    }

    expect(fakeXhr.aborted).toBe(false);
    expect(settled).toBe(false);
  });

  it("aborts a stalled chunk and surfaces a retryable timeout, not a terminal abort", async () => {
    const runtime = makeRuntime();
    const p = driveChunk(runtime);

    // Attach the rejection handler EARLY so the intentional abort never
    // surfaces as an unhandled rejection to the test runner.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let captured: any = null;
    p.catch((e) => {
      captured = e;
    });

    fakeXhr.emitProgress(512);
    await vi.advanceTimersByTimeAsync(31_000); // > CHUNK_IDLE_TIMEOUT_MS (30s)

    expect(fakeXhr.aborted).toBe(true);
    expect(captured?.kind).toBe("timeout");
  });
});