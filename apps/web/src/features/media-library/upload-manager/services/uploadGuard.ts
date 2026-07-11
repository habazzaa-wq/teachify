import { mediaLibraryService } from "../../services";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from "../../constants";
import type { UploadError } from "../types";

export interface GuardResult {
  ok: boolean;
  error?: UploadError;
}

export interface StorageSnapshot {
  used: number;
  remaining: number;
  total: number;
  usagePercent: number;
}

/**
 * Front-end counterpart to the backend UploadGuard service. Reuses the media
 * library storage endpoint for quota checks and the shared allow-list / size
 * limits so the client never diverges from the server's policy.
 */
class UploadGuardService {
  private storageCache: StorageSnapshot | null = null;
  private storageFetchedAt = 0;
  private readonly cacheTtl = 15_000;

  validateFile(file: File): GuardResult {
    if (file.size <= 0) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: "الملف فارغ أو غير صالح",
          retryable: false,
        },
      };
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: `حجم الملف يتجاوز الحد المسموح (${Math.round(MAX_UPLOAD_SIZE / 1_000_000_000)}GB)`,
          retryable: false,
        },
      };
    }

    if (file.type && !ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: "نوع الملف غير مدعوم",
          retryable: false,
        },
      };
    }

    return { ok: true };
  }

  async getStorage(force = false): Promise<StorageSnapshot> {
    const now = Date.now();
    if (!force && this.storageCache && now - this.storageFetchedAt < this.cacheTtl) {
      return this.storageCache;
    }
    const data = await mediaLibraryService.getStorage();
    const snapshot: StorageSnapshot = {
      used: data.used,
      remaining: Math.max(0, data.total - data.used),
      total: data.total,
      usagePercent: data.usage_percent,
    };
    this.storageCache = snapshot;
    this.storageFetchedAt = now;
    return snapshot;
  }

  invalidateStorage(): void {
    this.storageCache = null;
    this.storageFetchedAt = 0;
  }

  async checkQuota(fileSize: number): Promise<GuardResult> {
    try {
      const storage = await this.getStorage();
      if (fileSize > storage.remaining) {
        return {
          ok: false,
          error: {
            type: "quota",
            message: "مساحة التخزين المتبقية لا تكفي لهذا الملف",
            retryable: false,
          },
        };
      }
      return { ok: true };
    } catch {
      // If we can't reach the storage endpoint, allow the upload to proceed
      // and let the backend guard reject it if necessary.
      return { ok: true };
    }
  }
}

export const uploadGuard = new UploadGuardService();
