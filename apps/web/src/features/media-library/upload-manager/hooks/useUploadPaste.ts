"use client";

import { useEffect } from "react";
import { useUploadManagerStore } from "../store";
import { extractFilesFromClipboard } from "../utils/files";

/** Ctrl/⌘+V paste of images, screenshots and clipboard files. */
export function useUploadPaste() {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const files = extractFilesFromClipboard(e.clipboardData as DataTransfer);
      if (files.length > 0) {
        useUploadManagerStore.getState().openRename(files, { source: "paste" });
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
}
