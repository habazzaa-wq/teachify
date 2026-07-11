/// <reference lib="webworker" />

/**
 * SHA-256 hashing worker. Keeps expensive digest work off the main thread so
 * large-file uploads never block the UI. Receives blobs, replies with the
 * lowercase hex digest keyed by the caller-supplied request id.
 */

interface HashRequest {
  id: string;
  blob: Blob;
}

interface HashSuccess {
  id: string;
  ok: true;
  hash: string;
}

interface HashFailure {
  id: string;
  ok: false;
  error: string;
}

export type HashResponse = HashSuccess | HashFailure;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

ctx.onmessage = async (event: MessageEvent<HashRequest>) => {
  const { id, blob } = event.data;
  try {
    const buffer = await blob.arrayBuffer();
    const digest = await ctx.crypto.subtle.digest("SHA-256", buffer);
    const response: HashResponse = { id, ok: true, hash: toHex(digest) };
    ctx.postMessage(response);
  } catch (err) {
    const response: HashResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "hash failed",
    };
    ctx.postMessage(response);
  }
};
