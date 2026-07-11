"use client";

import { useEffect } from "react";
import { uploadEngine, networkMonitor } from "../services";

/**
 * Idempotently boots the upload engine: starts the network monitor and recovers
 * any uploads persisted in IndexedDB (after a refresh, crash or closed tab).
 * Mount this once near the UploadManager root.
 */
export function useUploadEngineBootstrap(): void {
  useEffect(() => {
    networkMonitor.start();
    void uploadEngine.recoverSessions();

    const onOnline = () => uploadEngine.resumeAll();
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      networkMonitor.stop();
    };
  }, []);
}
