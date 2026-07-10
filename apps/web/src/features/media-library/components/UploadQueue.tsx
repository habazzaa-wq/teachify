"use client";

import { X, CheckCircle2, AlertCircle, Loader2, FileUp } from "lucide-react";
import { AppButton, AppBadge } from "@/components/ui";
import { motion } from "framer-motion";

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  error?: string;
}

interface UploadQueueProps {
  items: UploadItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  visible: boolean;
  onToggle: () => void;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function UploadQueue({ items, onRemove, onRetry, onCancel, visible, onToggle }: UploadQueueProps) {
  if (!visible || items.length === 0) return null;

  const succeeded = items.filter((i) => i.status === "success").length;
  const failed = items.filter((i) => i.status === "error").length;
  const uploading = items.filter((i) => i.status === "uploading" || i.status === "pending").length;

  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 end-4 z-50 w-80 rounded-xl border bg-background shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">رفع الملفات</span>
          <AppBadge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {uploading > 0 ? `${uploading} جارٍ` : `${items.length} ملف`}
          </AppBadge>
        </div>
        <AppButton variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
          <X className="h-3.5 w-3.5" />
        </AppButton>
      </div>

      {/* Items */}
      <div className="max-h-72 space-y-1 overflow-y-auto p-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatSize(item.size)}</p>
              </div>

              {item.status === "success" && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              )}
              {item.status === "error" && (
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              )}
              {(item.status === "uploading" || item.status === "processing") && (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              )}
              {item.status === "pending" && (
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>

            {/* Progress bar */}
            {item.status === "uploading" && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}

            {/* Error message */}
            {item.status === "error" && item.error && (
              <p className="mt-1 text-[11px] text-destructive">{item.error}</p>
            )}

            {/* Actions */}
            <div className="mt-1.5 flex gap-1">
              {(item.status === "error" || item.status === "pending") && (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px]"
                  onClick={() => onRetry(item.id)}
                >
                  إعادة المحاولة
                </AppButton>
              )}
              {item.status === "success" ? (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px]"
                  onClick={() => onRemove(item.id)}
                >
                  إزالة
                </AppButton>
              ) : (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px] text-destructive"
                  onClick={() => onCancel(item.id)}
                >
                  إلغاء
                </AppButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          {succeeded > 0 && `${succeeded} تم بنجاح`}
          {failed > 0 && (succeeded > 0 ? " | " : "") + `${failed} فشل`}
        </span>
        {failed > 0 && (
          <button
            className="text-primary hover:underline"
            onClick={() => items.filter((i) => i.status === "error").forEach((i) => onRetry(i.id))}
          >
            إعادة الكل
          </button>
        )}
      </div>
    </motion.div>
  );
}

export { UploadQueue };
export type { UploadItem };
