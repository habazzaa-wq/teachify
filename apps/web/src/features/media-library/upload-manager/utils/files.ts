import type { MediaType } from "../../types";
import type { UploadItem, UploadWarning } from "../types";
import { UPLOAD_LARGE_FILE_BYTES } from "../constants";

let idCounter = 0;

export function generateUploadId(): string {
  idCounter += 1;
  return `up_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getFileCategory(mime: string, name: string): MediaType {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("zip") || mime.includes("compressed") || /\.(zip|rar|7z|tar|gz)$/i.test(name)) return "zip";
  if (mime.includes("presentation") || /\.(ppt|pptx|key)$/i.test(name)) return "presentation";
  if (mime.includes("spreadsheet") || /\.(xls|xlsx|csv)$/i.test(name)) return "spreadsheet";
  if (mime.startsWith("text/") || mime.includes("document") || /\.(doc|docx|txt|rtf|md)$/i.test(name)) return "document";
  return "file";
}

const PREVIEWABLE_TYPES = ["image", "video", "audio"];

export function createFilePreview(file: File): string | null {
  const category = getFileCategory(file.type, file.name);
  if (!PREVIEWABLE_TYPES.includes(category)) return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

export function revokeFilePreview(url: string | null): void {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

export function buildUploadWarnings(file: File): UploadWarning | null {
  if (file.size > UPLOAD_LARGE_FILE_BYTES) {
    return { type: "large", message: "ملف كبير الحجم — قد يستغرق وقتاً أطول" };
  }
  return null;
}

export function buildUploadItem(file: File, folderId: number | null): UploadItem {
  return {
    id: generateUploadId(),
    file,
    preview: createFilePreview(file),
    filename: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    category: getFileCategory(file.type, file.name),
    progress: 0,
    speed: 0,
    eta: null,
    status: "queued",
    retryCount: 0,
    chunkCount: 1,
    uploadedChunks: 0,
    chunkSize: 0,
    resumable: false,
    recovered: false,
    fileHash: null,
    checksumVerified: false,
    error: null,
    warning: buildUploadWarnings(file),
    retryAt: null,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    assetId: null,
    cdnUrl: null,
    folderId,
  };
}

/** Flatten a FileList / DataTransferItemList / nested folder tree into File[]. */
export function extractFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (const file of Array.from(dataTransfer.files)) {
      files.push(file);
    }
  }
  return files;
}

/** Pull files out of a clipboard paste event (images, screenshots, files). */
export function extractFilesFromClipboard(clipboardData: DataTransfer): File[] {
  const files: File[] = [];
  if (!clipboardData) return files;
  const items = clipboardData.items;
  if (items) {
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }
  if (files.length === 0 && clipboardData.files) {
    for (const file of Array.from(clipboardData.files)) {
      files.push(file);
    }
  }
  return files;
}

export function hasFilesInDataTransfer(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  if (dataTransfer.files && dataTransfer.files.length > 0) return true;
  const items = dataTransfer.items;
  if (items) {
    for (const item of Array.from(items)) {
      if (item.kind === "file") return true;
    }
  }
  return false;
}
