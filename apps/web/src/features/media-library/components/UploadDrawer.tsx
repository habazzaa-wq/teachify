"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileUp } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
} from "@/components/ui";
import { MAX_UPLOAD_SIZE } from "../constants";
import { useCreateUploadIntent, useConfirmUpload } from "../hooks";

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: number | null;
}

interface FileEntry {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function UploadDrawer({ open, onOpenChange, folderId }: UploadDrawerProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createIntent = useCreateUploadIntent();
  const confirmUpload = useConfirmUpload();

  const uploadFileRef = useRef<((entry: FileEntry) => void) | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter((f) => {
        if (f.size > MAX_UPLOAD_SIZE) {
          console.warn(`File too large: ${f.name}`);
          return false;
        }
        return true;
      })
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        progress: 0,
        status: "pending" as const,
      }));

    setFiles((prev) => [...prev, ...entries]);

    // Start uploading each file
    entries.forEach((entry) => uploadFileRef.current?.(entry));
  }, []);

  const uploadFile = useCallback(
    async (entry: FileEntry) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" as const, progress: 0 } : f)),
      );

      try {
        const intent = await createIntent.mutateAsync({
          type: entry.file.type.startsWith("video") ? "video" :
                entry.file.type.startsWith("image") ? "image" :
                entry.file.type.startsWith("audio") ? "audio" :
                entry.file.type === "application/pdf" ? "pdf" :
                "file",
          original_filename: entry.file.name,
          mime_type: entry.file.type,
          size_bytes: entry.file.size,
          folder_id: folderId ?? undefined,
        });

        // Upload to Bunny CDN
        if (intent.uploadUrl) {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setFiles((prev) =>
                prev.map((f) => (f.id === entry.id ? { ...f, progress } : f)),
              );
            }
          });

          await new Promise<void>((resolve, reject) => {
            xhr.addEventListener("load", () => resolve());
            xhr.addEventListener("error", () => reject(new Error("Upload failed")));
            xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

            xhr.open(intent.uploadMethod || "PUT", intent.uploadUrl!);
            Object.entries(intent.headers || {}).forEach(([k, v]) =>
              xhr.setRequestHeader(k, v as string),
            );
            xhr.send(entry.file);
          });

          // Confirm the upload
          await confirmUpload.mutateAsync({
            sessionId: intent.sessionId,
            payload: { size_bytes: entry.file.size },
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: "success" as const, progress: 100 } : f,
            ),
          );
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error" as const, error: err instanceof Error ? err.message : "فشل الرفع" }
              : f,
          ),
        );
      }
    },
    [createIntent, confirmUpload, folderId],
  );

  uploadFileRef.current = uploadFile;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      const entry = files.find((f) => f.id === id);
      if (entry) uploadFile(entry);
    },
    [files, uploadFile],
  );

  const handleClose = useCallback(() => {
    if (files.some((f) => f.status === "uploading")) {
      if (!confirm("هل أنت متأكد؟ هناك ملفات قيد الرفع.")) return;
    }
    onOpenChange(false);
    setFiles([]);
  }, [files, onOpenChange]);

  const succeeded = files.filter((f) => f.status === "success").length;
  const failed = files.filter((f) => f.status === "error").length;

  return (
    <AppDialog open={open} onOpenChange={handleClose}>
      <AppDialogContent className="max-w-lg sm:max-w-xl">
        <AppDialogHeader>
          <AppDialogTitle>رفع الملفات</AppDialogTitle>
        </AppDialogHeader>

        {/* Drop zone */}
        <div
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/40"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">اسحب وأفلت الملفات هنا</p>
          <p className="mt-1 text-xs text-muted-foreground">
            أو انقر لاختيار الملفات
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {files.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <FileUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{entry.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatSize(entry.file.size)}
                  </p>
                  {entry.status === "uploading" && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                  {entry.status === "error" && entry.error && (
                    <p className="text-[11px] text-destructive">{entry.error}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {entry.status === "success" && (
                    <span className="text-xs text-success">تم</span>
                  )}
                  {(entry.status === "error" || entry.status === "pending") && (
                    <AppButton
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-xs"
                      onClick={() => retryFile(entry.id)}
                    >
                      إعادة
                    </AppButton>
                  )}
                  <AppButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(entry.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {(succeeded > 0 || failed > 0) && (
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>
              {succeeded > 0 && `${succeeded} تم بنجاح`}
              {failed > 0 && (succeeded > 0 ? " | " : "") + `${failed} فشل`}
            </span>
            {failed > 0 && (
              <button
                className="text-primary hover:underline"
                onClick={() => files.filter((f) => f.status === "error").forEach((f) => retryFile(f.id))}
              >
                إعادة الكل
              </button>
            )}
          </div>
        )}
      </AppDialogContent>
    </AppDialog>
  );
}

export { UploadDrawer };
