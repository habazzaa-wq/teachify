"use client";

import { memo } from "react";
import {
  X,
  Download,
  Heart,
  Archive,
  Trash2,
  Eye,
  Pin,
  Copy,
  Pencil,
  FolderInput,
  Clock,
  HardDrive,
  Shield,
  Hash,
  Globe,
  Building,
  Lock,
  Play,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaAsset } from "../../hooks";
import { MEDIA_TYPE_CONFIG, MEDIA_STATUS_CONFIG, VISIBILITY_CONFIG } from "../../constants";
import type { MediaAsset } from "../../types";

interface MediaInspectorProps {
  assetId: number | null;
  onClose?: () => void;
  onFavorite?: (asset: MediaAsset) => void;
  onArchive?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
  onRename?: (asset: MediaAsset) => void;
  onMove?: (asset: MediaAsset) => void;
  onDuplicate?: (asset: MediaAsset) => void;
  onDownload?: (asset: MediaAsset) => void;
  onPin?: (asset: MediaAsset) => void;
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b py-3">
      <h4 className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        {title}
      </h4>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function InspectorRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-accent/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function OnboardingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Eye className="h-8 w-8 text-accent/40" />
      </div>
      <h3 className="mb-1 text-sm font-medium">لوحة التفاصيل</h3>
      <p className="text-xs text-muted-foreground/60">
        اختر ملفاً لعرض معلوماته和技术 البيانات
      </p>
    </div>
  );
}

function MediaInspectorBase({
  assetId,
  onClose,
  onFavorite,
  onArchive,
  onDelete,
  onRename,
  onMove,
  onDuplicate,
  onDownload,
  onPin,
}: MediaInspectorProps) {
  const { data: asset, isLoading } = useMediaAsset(assetId);

  if (!assetId) {
    return <OnboardingState />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        الملف غير موجود
      </div>
    );
  }

  const typeConfig = MEDIA_TYPE_CONFIG[asset.type] ?? MEDIA_TYPE_CONFIG.file;
  const statusConfig = MEDIA_STATUS_CONFIG[asset.status] ?? MEDIA_STATUS_CONFIG.pending;
  const visibilityConfig = VISIBILITY_CONFIG[asset.visibility] ?? VISIBILITY_CONFIG.private;
  const usages = asset.usages ?? [];
  const isVideo = asset.type === "video";
  const isImage = asset.type === "image";
  const isAudio = asset.type === "audio";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold">التفاصيل</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="relative border-b">
        <div className="aspect-video flex items-center justify-center bg-muted/30">
          {asset.thumbnailUrl || (isImage && asset.cdnUrl) ? (
            <img
              src={asset.thumbnailUrl ?? asset.cdnUrl!}
              alt={asset.title ?? asset.originalName ?? ""}
              className="h-full w-full object-contain"
            />
          ) : isVideo && asset.cdnUrl ? (
            <div className="relative flex h-full w-full items-center justify-center">
              {asset.posterUrl ? (
                <img src={asset.posterUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <Play className="h-12 w-12 text-blue-500/60" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                  <Play className="h-6 w-6 fill-current" />
                </div>
              </div>
            </div>
          ) : isAudio ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-purple-600/10">
              <FileText className="h-12 w-12 text-purple-500/40" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <span className="text-xl font-bold uppercase text-muted-foreground/40">
                  {asset.extension ?? asset.type.slice(0, 3)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Duration overlay */}
        {asset.duration > 0 && (
          <div className="absolute bottom-2 start-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(asset.duration)}
          </div>
        )}
      </div>

      {/* Title & badges */}
      <div className="border-b px-4 py-3">
        <h4 className="text-sm font-semibold">{asset.title ?? asset.originalName ?? "بدون اسم"}</h4>
        {asset.originalFilename && asset.originalFilename !== asset.title && (
          <p className="mt-0.5 text-xs text-muted-foreground">{asset.originalFilename}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            statusConfig.color === "success" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
            statusConfig.color === "warning" && "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
            statusConfig.color === "destructive" && "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
            statusConfig.color === "info" && "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
            statusConfig.color === "secondary" && "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
          )}>
            {statusConfig.label}
          </span>
          <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium">
            {typeConfig.label}
          </span>
          {asset.pinned && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Pin className="h-2.5 w-2.5" /> مثبت
            </span>
          )}
          {asset.favorite && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
              <Heart className="h-2.5 w-2.5 fill-current" /> مفضل
            </span>
          )}
        </div>
      </div>

      {/* Technical Information */}
      <InspectorSection title="المعلومات التقنية">
        <InspectorRow label="الحجم" value={formatSize(asset.size)} icon={HardDrive} />
        {asset.width && asset.height && (
          <InspectorRow label="الأبعاد" value={`${asset.width} × ${asset.height}`} icon={Eye} />
        )}
        {asset.duration > 0 && (
          <InspectorRow label="المدة" value={formatDuration(asset.duration)} icon={Clock} />
        )}
        <InspectorRow label="الامتداد" value={asset.extension?.toUpperCase() ?? "—"} icon={FileText} />
        <InspectorRow label="MIME Type" value={asset.mimeType ?? "—"} />
        {asset.checksum && (
          <InspectorRow label="Checksum" value={<span dir="ltr" className="font-mono text-[10px]">{asset.checksum.slice(0, 16)}...</span>} icon={Hash} />
        )}
      </InspectorSection>

      {/* CDN / Bunny Info */}
      {(asset.cdnUrl || asset.bunnyVideoId || asset.bunnyLibraryId || asset.bunnyStoragePath) && (
        <InspectorSection title="الخادم والتخزين">
          {asset.cdnUrl && (
            <InspectorRow
              label="CDN URL"
              value={
                <a href={asset.cdnUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  فتح
                </a>
              }
              icon={Globe}
            />
          )}
          {asset.bunnyStoragePath && (
            <InspectorRow label="Storage Path" value={<span dir="ltr" className="truncate max-w-[140px] text-[10px] font-mono">{asset.bunnyStoragePath}</span>} icon={HardDrive} />
          )}
          {asset.bunnyVideoId && (
            <InspectorRow label="Stream Library" value={asset.bunnyLibraryId ?? "—"} icon={HardDrive} />
          )}
        </InspectorSection>
      )}

      {/* Metadata */}
      <InspectorSection title="البيانات الوصفية">
        <InspectorRow
          label="الرؤية"
          value={
            <span className="inline-flex items-center gap-1">
              {asset.visibility === "private" && <Lock className="h-3 w-3" />}
              {asset.visibility === "organization" && <Building className="h-3 w-3" />}
              {asset.visibility === "public" && <Globe className="h-3 w-3" />}
              {visibilityConfig.label}
            </span>
          }
        />
        {asset.language && <InspectorRow label="اللغة" value={asset.language} />}
        <InspectorRow label="تاريخ الرفع" value={formatDate(asset.createdAt)} icon={Clock} />
        <InspectorRow label="آخر تحديث" value={formatDate(asset.updatedAt)} icon={Clock} />
        {asset.uploader && (
          <InspectorRow label="رفع بواسطة" value={asset.uploader.name} icon={Shield} />
        )}
        {asset.createdBy && asset.createdBy.id !== asset.uploader?.id && (
          <InspectorRow label="أنشئ بواسطة" value={asset.createdBy.name} icon={Shield} />
        )}
        {asset.folder && (
          <InspectorRow label="المجلد" value={asset.folder.name} icon={FolderInput} />
        )}
      </InspectorSection>

      {/* Tags */}
      {asset.tags.length > 0 && (
        <InspectorSection title="الوسوم">
          <div className="flex flex-wrap gap-1 px-4">
            {asset.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </InspectorSection>
      )}

      {/* Usage */}
      <InspectorSection title="الاستخدام">
        {usages.length === 0 ? (
          <p className="px-4 py-2 text-[11px] text-muted-foreground/60">
            لم يتم استخدام هذا الملف في أي محتوى بعد.
          </p>
        ) : (
          <div className="space-y-1 px-4">
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {usages.filter((u) => u.entityType === "course").length > 0 && (
                <span>{usages.filter((u) => u.entityType === "course").length} دورة</span>
              )}
              {usages.filter((u) => u.entityType === "lecture").length > 0 && (
                <span>{usages.filter((u) => u.entityType === "lecture").length} محاضرة</span>
              )}
              {usages.filter((u) => u.entityType === "assignment").length > 0 && (
                <span>{usages.filter((u) => u.entityType === "assignment").length} تكليف</span>
              )}
              {usages.filter((u) => u.entityType === "certificate").length > 0 && (
                <span>{usages.filter((u) => u.entityType === "certificate").length} شهادة</span>
              )}
            </div>
            <ul className="space-y-1">
              {usages.slice(0, 5).map((usage) => (
                <li
                  key={`${usage.entityType}-${usage.entityId}-${usage.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-accent/30 px-2.5 py-1.5 text-[11px]"
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
                      className="shrink-0 text-accent hover:underline"
                    >
                      فتح
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </InspectorSection>

      {/* Recent Activity */}
      <InspectorSection title="النشاط الأخير">
        <InspectorRow label="تم الإنشاء" value={formatDate(asset.createdAt)} />
        <InspectorRow label="آخر تعديل" value={formatDate(asset.updatedAt)} />
        {asset.archivedAt && (
          <InspectorRow label="تم الأرشفة" value={formatDate(asset.archivedAt)} />
        )}
      </InspectorSection>

      {/* Quick Actions */}
      <div className="border-t p-3">
        <div className="grid grid-cols-4 gap-1.5">
          {onRename && (
            <button
              onClick={() => onRename(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
              إعادة تسمية
            </button>
          )}
          {onMove && (
            <button
              onClick={() => onMove(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <FolderInput className="h-4 w-4" />
              نقل
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
              نسخ
            </button>
          )}
          {onDownload && (
            <button
              onClick={() => onDownload(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              تحميل
            </button>
          )}
          {onFavorite && (
            <button
              onClick={() => onFavorite(asset)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] transition-colors hover:bg-accent",
                asset.favorite ? "text-red-500" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart className={cn("h-4 w-4", asset.favorite && "fill-current")} />
              {asset.favorite ? "إلغاء المفضلة" : "مفضلة"}
            </button>
          )}
          {onPin && (
            <button
              onClick={() => onPin(asset)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] transition-colors hover:bg-accent",
                asset.pinned ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Pin className="h-4 w-4" />
              {asset.pinned ? "إلغاء التثبيت" : "تثبيت"}
            </button>
          )}
          {onArchive && (
            <button
              onClick={() => onArchive(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Archive className="h-4 w-4" />
              أرشفة
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(asset)}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const MediaInspector = memo(MediaInspectorBase);
