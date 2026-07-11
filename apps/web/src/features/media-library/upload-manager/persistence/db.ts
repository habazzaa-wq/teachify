import {
  UPLOAD_DB_NAME,
  UPLOAD_DB_STORE,
  UPLOAD_DB_UPLOAD_INDEX,
  UPLOAD_DB_VERSION,
} from "../constants";

/**
 * Minimal, dependency-free IndexedDB wrapper for the upload engine. Persists
 * full upload records (session + chunk map + the file blob) so uploads survive
 * refreshes, crashes and closed tabs. LocalStorage is deliberately NOT used —
 * it cannot hold binary blobs and blocks the main thread.
 */

function isSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!isSupported()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(UPLOAD_DB_NAME, UPLOAD_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UPLOAD_DB_STORE)) {
        const store = db.createObjectStore(UPLOAD_DB_STORE, { keyPath: "sessionId" });
        store.createIndex(UPLOAD_DB_UPLOAD_INDEX, "uploadId", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onblocked = () => reject(new Error("IndexedDB open blocked"));
  }).catch((err) => {
    // Reset so a later call can retry (e.g. private-mode quirks).
    dbPromise = null;
    throw err;
  });

  return dbPromise;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(UPLOAD_DB_STORE, mode);
    const store = tx.objectStore(UPLOAD_DB_STORE);
    let result: T;
    let settled = false;

    Promise.resolve(fn(store))
      .then((value) => {
        if (value instanceof IDBRequest) {
          return promisifyRequest(value as IDBRequest<T>);
        }
        return value as T;
      })
      .then((value) => {
        result = value;
      })
      .catch((err) => {
        settled = true;
        try {
          tx.abort();
        } catch {
          // ignore
        }
        reject(err);
      });

    tx.oncomplete = () => {
      if (!settled) resolve(result);
    };
    tx.onerror = () => {
      if (!settled) reject(tx.error ?? new Error("IndexedDB transaction failed"));
    };
    tx.onabort = () => {
      if (!settled) reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    };
  });
}

export const uploadDb = {
  isSupported,

  async put<T extends { sessionId: string }>(record: T): Promise<void> {
    await withStore("readwrite", (store) => store.put(record));
  },

  async get<T>(sessionId: string): Promise<T | undefined> {
    return withStore("readonly", (store) => store.get(sessionId) as IDBRequest<T | undefined>);
  },

  async getAll<T>(): Promise<T[]> {
    const result = await withStore("readonly", (store) => store.getAll() as IDBRequest<T[]>);
    return result ?? [];
  },

  async delete(sessionId: string): Promise<void> {
    await withStore("readwrite", (store) => store.delete(sessionId));
  },

  async deleteByUploadId(uploadId: string): Promise<void> {
    await withStore("readwrite", (store) => {
      return new Promise<void>((resolve, reject) => {
        const index = store.index(UPLOAD_DB_UPLOAD_INDEX);
        const cursorReq = index.openCursor(IDBKeyRange.only(uploadId));
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error ?? new Error("cursor failed"));
      });
    });
  },

  async clear(): Promise<void> {
    await withStore("readwrite", (store) => store.clear());
  },
};
