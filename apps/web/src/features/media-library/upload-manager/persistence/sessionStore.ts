import { uploadDb } from "./db";
import type { PersistedUploadRecord, UploadChunk, UploadSession } from "../types";

/**
 * Typed facade over the IndexedDB store for upload sessions. All writes are
 * best-effort: persistence must never break an in-flight upload, so failures
 * are swallowed (the upload still works, it just won't be recoverable).
 */
export const sessionStore = {
  isSupported: uploadDb.isSupported,

  async save(record: PersistedUploadRecord): Promise<void> {
    try {
      await uploadDb.put(flatten(record));
    } catch {
      // best-effort persistence
    }
  },

  async saveSession(session: UploadSession, chunks: UploadChunk[], blob: Blob): Promise<void> {
    try {
      await uploadDb.put(flatten({ session, chunks, blob }));
    } catch {
      // best-effort persistence
    }
  },

  async load(sessionId: string): Promise<PersistedUploadRecord | undefined> {
    try {
      const raw = await uploadDb.get<StoredRecord>(sessionId);
      return raw ? unflatten(raw) : undefined;
    } catch {
      return undefined;
    }
  },

  async loadAll(): Promise<PersistedUploadRecord[]> {
    try {
      const rows = await uploadDb.getAll<StoredRecord>();
      return rows.map(unflatten);
    } catch {
      return [];
    }
  },

  async remove(sessionId: string): Promise<void> {
    try {
      await uploadDb.delete(sessionId);
    } catch {
      // ignore
    }
  },

  async removeByUploadId(uploadId: string): Promise<void> {
    try {
      await uploadDb.deleteByUploadId(uploadId);
    } catch {
      // ignore
    }
  },

  /** Drop any sessions whose TTL has elapsed. Returns the removed count. */
  async pruneExpired(now = Date.now()): Promise<number> {
    try {
      const rows = await uploadDb.getAll<StoredRecord>();
      let removed = 0;
      for (const row of rows) {
        if (row.session.expiresAt <= now) {
          await uploadDb.delete(row.sessionId);
          removed += 1;
        }
      }
      return removed;
    } catch {
      return 0;
    }
  },
};

/**
 * The record stored in IndexedDB. `sessionId` is hoisted to the top level so it
 * can serve as the object-store keyPath and `uploadId` as an index.
 */
interface StoredRecord {
  sessionId: string;
  uploadId: string;
  session: UploadSession;
  chunks: UploadChunk[];
  blob: Blob;
}

function flatten(record: PersistedUploadRecord): StoredRecord {
  return {
    sessionId: record.session.sessionId,
    uploadId: record.session.uploadId,
    session: record.session,
    chunks: record.chunks,
    blob: record.blob,
  };
}

function unflatten(raw: StoredRecord): PersistedUploadRecord {
  return { session: raw.session, chunks: raw.chunks, blob: raw.blob };
}
