/**
 * Client-side state for the photo-answer capture flow. The server is the
 * source of truth for anything already confirmed; this file only models what
 * exists in the browser before/while a page reaches the backend.
 */

export type ImagePageDraftStatus =
  /** added but never rendered/edited — not yet uploaded */
  | "draft"
  /** picked for upload, waiting its turn in the sequential queue */
  | "queued"
  /** intent issued and the PUT is in flight */
  | "uploading"
  /** intent → PUT → confirm all succeeded */
  | "done"
  /** transient failure (network, storage, server) — retry available */
  | "error"
  /** terminal: the exam timer expired or the attempt is no longer writable */
  | "expired";

/** Normalized rectangle (0..1) relative to the rotated image. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ImageRotation = 0 | 90 | 180 | 270;

export interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  mimeType: string;
}

export interface ImagePageDraft {
  id: string;
  source: File;
  /** Preview of the RAW source (never revoked early; rotation/crop are edits). */
  rawUrl: string;
  rotation: ImageRotation;
  crop: CropRect | null;
  /** Lazily rendered (rotation+crop baked in) — produced at upload time. */
  processed: ProcessedImage | null;
  status: ImagePageDraftStatus;
  progress: number;
  error: string | null;
  capturedAt: string;
  /** Set once confirm() returns; used to dedupe against the read endpoint. */
  serverPageId: string | null;
}

export interface PageUploadResult {
  type: "ok";
  pageId: string;
  pageOrder: number;
  gradingStatus: string;
}

export type PageUploadFinishResult =
  | PageUploadResult
  | { type: "expired"; message?: string }
  | { type: "error"; error: ClassifiedUploadError };

export type UploadErrorKind = "retryable" | "expired" | "fatal";

export interface ClassifiedUploadError {
  kind: UploadErrorKind;
  message: string;
  field?: string;
}