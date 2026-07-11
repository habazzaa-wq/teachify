"use client";

import { useEffect } from "react";
import { useCan } from "@/hooks/useCan";
import { useUploadManagerStore } from "../store";
import { UPLOAD_PERMISSION } from "../services";

export type UploadPickerMode = "file" | "folder";

export const UPLOAD_PICK_EVENT = "upload-manager:pick";

/**
 * Keyboard shortcuts:
 * - Ctrl/⌘+U        → open the upload picker (files)
 * - Ctrl/⌘+Shift+U  → open the upload picker (folder)
 * - Esc             → cancel the drag overlay
 */
export function useUploadShortcuts() {
  const canUpload = useCan(UPLOAD_PERMISSION);
  const setDragDepth = useUploadManagerStore((s) => s.setDragDepth);
  const setOpen = useUploadManagerStore((s) => s.setOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        if (typing) return;
        if (!canUpload) return;
        e.preventDefault();
        setOpen(true);
        const mode: UploadPickerMode = e.shiftKey ? "folder" : "file";
        window.dispatchEvent(new CustomEvent(UPLOAD_PICK_EVENT, { detail: { mode } }));
        return;
      }

      if (e.key === "Escape") {
        const { isDragActive } = useUploadManagerStore.getState();
        if (isDragActive) {
          e.preventDefault();
          setDragDepth(0);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUpload, setDragDepth, setOpen]);
}
