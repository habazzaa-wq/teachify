"use client";

import { X, Download, ExternalLink, Heart, Archive, Trash2, Eye, Link2 } from "lucide-react";
import { AppButton, AppBadge } from "@/components/ui";
import { MEDIA_TYPE_CONFIG, MEDIA_STATUS_CONFIG, VISIBILITY_CONFIG } from "../constants";
import { cn } from "@/lib/cn";
import type { MediaAsset, MediaUsage } from "../types";

interface MediaPreviewProps {
  asset: MediaAsset | null;
  usages?: MediaUsage[];
  onClose?: () => void;
  onDownload?: (asset: MediaAsset) => void;
  onFavorite?: (asset: MediaAsset) => void;
  onArchive?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MediaPreview({ asset, usages, onClose, onDownload, onFavorite, onArchive, onDelete }: MediaPreviewProps) {
  if (!asset) return null;

  const typeConfig = MEDIA_TYPE_CONFIG[asset.type] ?? MEDIA_TYPE_CONFIG.file;
  const statusConfig = MEDIA_STATUS_CONFIG[asset.status] ?? MEDIA_STATUS_CONFIG.pending;
  const visibilityConfig = VISIBILITY_CONFIG[asset.visibility] ?? VISIBILITY_CONFIG.private;
  const resolvedUsages = usages ?? asset.usages ?? [];

  return (
    <div className="flex h-full flex-col border-s bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">معاينة</h3>
        <AppButton variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </AppButton>
      </div>

      {/* Preview area */}
      <div className="flex aspect-video items-center justify-center bg-muted/30">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.title ?? asset.originalName ?? ""}
            className="h-full w-full object-contain"
          />
        ) : asset.type === "image" && asset.cdnUrl ? (
          <img
            src={asset.cdnUrl}
            alt={asset.title ?? asset.originalName ?? ""}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <span className="text-2xl font-bold uppercase">
                {asset.extension ?? asset.type.slice(0, 2)}
              </span>
            </div>
            <span className="text-xs">{typeConfig.label}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h4 className="text-sm font-medium">{asset.title ?? asset.originalName ?? "بدون اسم"}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{asset.originalFilename}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AppBadge variant="outline">{typeConfig.label}</AppBadge>
          <AppBadge variant="outline" className={statusConfig.color}>
            {statusConfig.label}
          </AppBadge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الحجم</span>
            <span>{formatSize(asset.size)}</span>
          </div>
          {asset.duration > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدة</span>
              <span>{formatDuration(asset.duration)}</span>
            </div>
          )}
          {asset.width && asset.height && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الأبعاد</span>
              <span>{asset.width} × {asset.height}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">النوع</span>
            <span dir="ltr" className="text-end">{asset.mimeType ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الرؤية</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {visibilityConfig.label}
            </span>
          </div>
          {asset.language && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">اللغة</span>
              <span>{asset.language}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الرفع</span>
            <span>{new Date(asset.createdAt).toLocaleDateString("ar-SA")}</span>
          </div>
          {asset.uploader && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">رفع بواسطة</span>
              <span>{asset.uploader.name}</span>
            </div>
          )}
          {asset.createdBy && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">أنشئ بواسطة</span>
              <span>{asset.createdBy.name}</span>
            </div>
          )}
          {asset.isProcessing && (
            <div className="pt-1">
              <div className="mb-1 flex justify-between">
                <span className="text-muted-foreground">التقدم</span>
                <span>{asset.processingProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${asset.processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {asset.tags && asset.tags.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">الوسوم</p>
            <div className="flex flex-wrap gap-1">
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Where Used — extension point for future backend integration */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            مستخدم في
          </p>
          {resolvedUsages.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
              لم يتم استخدام هذا الملف في أي محتوى بعد.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {resolvedUsages.map((usage) => (
                <li
                  key={`${usage.entityType}-${usage.entityId}-${usage.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{usage.entityTitle}</p>
                    {usage.context && (
                      <p className="truncate text-[10px] text-muted-foreground">{usage.context}</p>
                    )}
                  </div>
                  {usage.url && (
                    <a
                      href={usage.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn("shrink-0 text-primary hover:underline")}
                    >
                      فتح
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t p-2">
        {onDownload && (
          <AppButton variant="ghost" size="icon" onClick={() => onDownload(asset)} title="تحميل">
            <Download className="h-4 w-4" />
          </AppButton>
        )}
        {onFavorite && (
          <AppButton
            variant="ghost"
            size="icon"
            onClick={() => onFavorite(asset)}
            title={asset.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            className={asset.favorite ? "text-red-500" : ""}
          >
            <Heart className={`h-4 w-4 ${asset.favorite ? "fill-current" : ""}`} />
          </AppButton>
        )}
        {onArchive && (
          <AppButton variant="ghost" size="icon" onClick={() => onArchive(asset)} title="أرشفة">
            <Archive className="h-4 w-4" />
          </AppButton>
        )}
        {onDelete && (
          <AppButton variant="ghost" size="icon" onClick={() => onDelete(asset)} title="حذف">
            <Trash2 className="h-4 w-4" />
          </AppButton>
        )}
        {asset.cdnUrl && (
          <AppButton
            variant="ghost"
            size="icon"
            onClick={() => window.open(asset.cdnUrl!, "_blank")}
            title="فتح الرابط"
          >
            <ExternalLink className="h-4 w-4" />
          </AppButton>
        )}
      </div>
    </div>
  );
}

export { MediaPreview };
