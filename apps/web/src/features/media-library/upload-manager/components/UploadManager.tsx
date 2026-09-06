"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUploadManagerStore } from "../store";
import { uploadEngine } from "../services";
import { hashPool } from "../services/hashPool";
import { useUploadDragDrop, useUploadPaste, useUploadShortcuts, useUploadManager, useUploadManagerStats, UPLOAD_PICK_EVENT, useUploadEngineBootstrap } from "../hooks";
import { MEDIA_QUERY_KEY } from "../../constants";
import { BUNNY_CENTER_QUERY_KEY } from "../../../bunny-center/constants";
import { UploadManagerPanel } from "./UploadManagerPanel";
import { UploadDragOverlay } from "./UploadDragOverlay";
import { UPLOAD_LAUNCHER_COUNT_CAP } from "../constants";

const folderInputProps = { webkitdirectory: "", directory: "", multiple: true } as Record<string, string | boolean>;

export function UploadManager() {
  const isOpen = useUploadManagerStore((s) => s.isOpen);
  const setOpen = useUploadManagerStore((s) => s.setOpen);
  const toggleOpen = useUploadManagerStore((s) => s.toggleOpen);
  const { enqueueFiles } = useUploadManager();
  const stats = useUploadManagerStats();
  const queryClient = useQueryClient();

  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  useUploadDragDrop();
  useUploadPaste();
  useUploadShortcuts();
  useUploadEngineBootstrap();

  // Dispose the hash worker pool on unmount to avoid leaking workers.
  useEffect(() => {
    return () => {
      hashPool.dispose();
    };
  }, []);

  useEffect(() => {
    const off = uploadEngine.registerInvalidator(() => {
      queryClient.invalidateQueries({ queryKey: [MEDIA_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BUNNY_CENTER_QUERY_KEY] });
    });
    return off;
  }, [queryClient]);

  useEffect(() => {
    const onPick = (e: Event) => {
      const mode = (e as CustomEvent<{ mode?: string }>).detail?.mode;
      if (mode === "folder") folderRef.current?.click();
      else fileRef.current?.click();
    };
    window.addEventListener(UPLOAD_PICK_EVENT, onPick);
    return () => window.removeEventListener(UPLOAD_PICK_EVENT, onPick);
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) enqueueFiles(files, { source: "file-input" });
    e.target.value = "";
  };

  const handleFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) enqueueFiles(files, { source: "folder-input" });
    e.target.value = "";
  };

  const badgeCount = stats.active > 0 ? stats.active : stats.total;
  const hasActivity = stats.active > 0;

  return (
    <>
      <UploadDragOverlay />

      {/* Hidden pickers */}
      <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} aria-hidden />
      <input ref={folderRef} type="file" multiple hidden {...folderInputProps} onChange={handleFolder} aria-hidden />

      <div className="fixed z-50 bottom-4 end-4 flex flex-col items-end gap-3 max-md:inset-x-0 max-md:bottom-0 max-md:end-0 max-md:px-0">
        <AnimatePresence mode="wait">
          {isOpen && (
            <UploadManagerPanel
              key="panel"
              onToggle={toggleOpen}
              onUploadFiles={() => fileRef.current?.click()}
              onUploadFolder={() => folderRef.current?.click()}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isOpen && (
            <motion.button
              key="launcher"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="فتح مدير الرفع"
              initial={{ opacity: 0, scale: 0.8, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "flex items-center gap-2 rounded-full border border-studio-border bg-studio-accent px-4 py-3 text-studio-accent-fg shadow-floating transition-colors hover:bg-studio-accent/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
                "max-md:mb-3 max-md:me-3",
              )}
            >
              <span className="relative flex">
                {hasActivity && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                )}
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">مدير الرفع</span>
              {badgeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold tabular-nums">
                  {badgeCount > UPLOAD_LAUNCHER_COUNT_CAP ? `${UPLOAD_LAUNCHER_COUNT_CAP}+` : badgeCount}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
