"use client";

import { useEffect } from "react";
import { stageFilesForLibrary } from "../services";
import { useUploadManagerStore } from "../store";
import { extractFilesFromDataTransfer, hasFilesInDataTransfer } from "../utils/files";

/**
 * Global drag & drop. Shows an animated overlay whenever files are dragged
 * anywhere over the window and enqueues them on drop. Works across the whole
 * workspace without modifying the workspace itself.
 */
export function useUploadDragDrop() {
  const setDragDepth = useUploadManagerStore((s) => s.setDragDepth);

  useEffect(() => {
    let depth = 0;
    let draggingBlogImage = false;

    const hasFiles = (e: DragEvent) => hasFilesInDataTransfer(e.dataTransfer);
    const isBlogImage = (e: DragEvent) =>
      e.target instanceof Element && Boolean(e.target.closest(".blog-editor-content img.blog-inline-image"));

    const onDragStart = (e: DragEvent) => {
      draggingBlogImage = isBlogImage(e);
    };

    const onDragEnter = (e: DragEvent) => {
      if (draggingBlogImage || !hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragDepth(depth);
    };

    const onDragOver = (e: DragEvent) => {
      if (draggingBlogImage || !hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = (e: DragEvent) => {
      if (draggingBlogImage || !hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      setDragDepth(depth);
    };

    const onDrop = (e: DragEvent) => {
      if (draggingBlogImage) {
        draggingBlogImage = false;
        depth = 0;
        setDragDepth(0);
        return;
      }
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragDepth(0);
      const files = extractFilesFromDataTransfer(e.dataTransfer as DataTransfer);
      if (files.length > 0) {
        stageFilesForLibrary(files, { source: "drag-drop" });
      }
    };

    const onDragEnd = () => {
      if (!draggingBlogImage) return;
      draggingBlogImage = false;
      depth = 0;
      setDragDepth(0);
    };

    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onDragEnd);

    return () => {
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, [setDragDepth]);
}
