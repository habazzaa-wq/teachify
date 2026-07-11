import { CHUNK_MIN_FILE_SIZE, CHUNK_SIZE_TABLE, CHUNK_SIZE_256KB } from "../constants";
import type { UploadChunk } from "../types";

/**
 * Adaptive chunk-size selection. Larger files use larger chunks to keep the
 * total chunk count (and per-chunk request overhead) reasonable.
 */
export function selectChunkSize(fileSize: number): number {
  for (const bucket of CHUNK_SIZE_TABLE) {
    if (fileSize <= bucket.maxFileSize) return bucket.chunkSize;
  }
  return CHUNK_SIZE_256KB;
}

/** Whether a file is large enough to justify the chunk/resumable transport. */
export function shouldChunk(fileSize: number): boolean {
  return fileSize > CHUNK_MIN_FILE_SIZE;
}

export function computeTotalChunks(fileSize: number, chunkSize: number): number {
  if (fileSize <= 0 || chunkSize <= 0) return 0;
  return Math.ceil(fileSize / chunkSize);
}

let chunkCounter = 0;

function nextChunkId(uploadId: string, index: number): string {
  chunkCounter += 1;
  return `${uploadId}_c${index}_${chunkCounter.toString(36)}`;
}

/** Build the ordered chunk descriptors for a file (no bytes are read here). */
export function buildChunks(uploadId: string, fileSize: number, chunkSize: number): UploadChunk[] {
  const total = computeTotalChunks(fileSize, chunkSize);
  const chunks: UploadChunk[] = [];
  for (let index = 0; index < total; index += 1) {
    const offset = index * chunkSize;
    const size = Math.min(chunkSize, fileSize - offset);
    chunks.push({
      chunkId: nextChunkId(uploadId, index),
      uploadId,
      index,
      offset,
      size,
      hash: null,
      status: "pending",
      retryCount: 0,
      uploadedAt: null,
    });
  }
  return chunks;
}

/** Slice the underlying blob for a single chunk. */
export function sliceChunk(blob: Blob, chunk: UploadChunk): Blob {
  return blob.slice(chunk.offset, chunk.offset + chunk.size);
}

/** HTTP Content-Range header value for a resumable chunk PUT. */
export function contentRange(chunk: UploadChunk, totalSize: number): string {
  const start = chunk.offset;
  const end = chunk.offset + chunk.size - 1;
  return `bytes ${start}-${end}/${totalSize}`;
}
