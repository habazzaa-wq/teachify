"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileUp, Image as ImageIcon, Video } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
} from "@/components/ui";
import { acceptForLibrary, MEDIA_LIBRARY_LABELS } from "../constants";
import { stageFilesForLibrary } from "../upload-manager/services";
import { useUploadManager } from "../upload-manager/hooks";
import type { MediaLibrary } from "../types";

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: number | null;
  library?: MediaLibrary;
}

/**
 * The drawer is only a file intake surface. Every byte is handed to the shared
 * UploadManager so validation, chunking, resume, routing and progress all have
 * one implementation. `library` makes the routing explicit: videos go to
 * Bunny Stream, everything else is written to the tenant's own server.
 */
function UploadDrawer({ open, onOpenChange, folderId, library = "media" }: UploadDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { canUpload } = useUploadManager();

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0 || !canUpload) return;
      // Filtering + the rename dialog live in the shared intake path so drawer,
      // global drag/drop, paste and keyboard shortcut behave identically.
      stageFilesForLibrary(files, {
        folderId: folderId ?? null,
        library,
        source: "file-input",
      });
      onOpenChange(false);
    },
    [canUpload, folderId, library, onOpenChange],
  );

  const isVideos = library === "videos";
  const Icon = isVideos ? Video : ImageIcon;
  const accept = acceptForLibrary(library);

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>
            رفع {isVideos ? "فيديو" : "ملف"} إلى {MEDIA_LIBRARY_LABELS[library]}
          </AppDialogTitle>
        </AppDialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            // The window-level drop hook must not stage the same files twice.
            e.stopPropagation();
            setIsDragging(false);
            handleFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? "border-accent bg-accent/5"
              : "border-border bg-muted/20 hover:border-accent/60"
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium">
              اسحب {isVideos ? "الفيديوهات" : "الملفات"} هنا أو اختر من جهازك
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isVideos
                ? "يتم رفع الفيديوهات فقط إلى باني ستريم."
                : "الصور والملفات تُحفظ على سيرفر المؤسسة، ولا تُرفع إلى باني."}
            </p>
          </div>
          <AppButton
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!canUpload}
          >
            <Upload className="me-2 h-4 w-4" />
            اختيار {isVideos ? "فيديو" : "ملفات"}
          </AppButton>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            hidden
            onChange={(e) => {
              handleFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <FileUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            ستظهر الملفات في نافذة مدير الرفع حيث يمكنك متابعة التقدم أو الإيقاف
            المؤقت. اختر المجلد من الشريط الجانبي قبل الرفع عند الحاجة.
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="me-2 h-4 w-4" />
            إغلاق
          </AppButton>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { UploadDrawer };
