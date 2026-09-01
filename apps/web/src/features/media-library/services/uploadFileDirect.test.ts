import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mediaLibraryService } from "./index";

/**
 * Regression guard for the direct-upload path.
 *
 * The engine's media-library video path always streams through resumable
 * chunks (every resumable intent returns an upload URL), so the chunk XHR has
 * its own 120s timeout. But uploadFileDirect() -- used for direct server-side
 * uploads such as course images -- is a bare `fetch`. A network blackhole with
 * no timeout would leave that promise pending forever (the UI spins "uploading"
 * indefinitely). This test pins the bounded failure mode: the request must be
 * tied to an AbortSignal.timeout so it can never silently hang.
 */
describe("uploadFileDirect bounded timeout", () => {
  const originalTimeout = globalThis.AbortSignal?.timeout;
  const originalFetch = globalThis.fetch;

  let capturedMs: number | null = null;
  const controller = new AbortController();

  beforeEach(() => {
    capturedMs = null;

    // Intercept AbortSignal.timeout so we can assert the exact bound AND control
    // abort behaviour deterministically (no real 5-minute wait in tests).
    (globalThis.AbortSignal as unknown as { timeout: unknown }).timeout = vi.fn(
      (ms: number) => {
        capturedMs = ms;
        return controller.signal;
      },
    );

    // fetch records the signal, never resolving on its own (simulating a hung
    // request), but rejects as real fetch does if the attached signal aborts.
    const abortMockFactory = () =>
      new Promise((_resolve, reject) => {
        const onAbort = () => {
          controller.signal.removeEventListener("abort", onAbort);
          reject(new DOMException("The operation was aborted.", "AbortError"));
        };
        controller.signal.addEventListener("abort", onAbort);
      });
    vi.stubGlobal("fetch", vi.fn(abortMockFactory));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalTimeout) {
      (globalThis.AbortSignal as unknown as { timeout: unknown }).timeout = originalTimeout;
    }
    globalThis.fetch = originalFetch;
  });

  it("attaches a bounded AbortSignal so a blackholed request cannot hang forever", async () => {
    const file = new File(["x".repeat(1024)], "thumb.png", { type: "image/png" });
    const promise = mediaLibraryService.uploadFileDirect(file, "public");

    // Give the async function time to reach fetch().
    await Promise.resolve();
    await Promise.resolve();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown,
      { signal?: AbortSignal },
    ];
    expect(init?.signal).toBe(controller.signal);

    // The timeout must be present and finite (a sane upper bound, not 0 / no signal).
    expect(capturedMs).toBeGreaterThan(0);
    expect(Number.isFinite(capturedMs)).toBe(true);

    // Abort must actually surface a rejection instead of hanging: abort the
    // request the same way the timeout would and ensure the promise settles
    // with an AbortError rather than staying pending forever.
    controller.abort();
    await expect(promise).rejects.toThrow("aborted");
  });
});
