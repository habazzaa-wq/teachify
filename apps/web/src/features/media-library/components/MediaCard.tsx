"use client";

import { useCallback } from "react";
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Heart,
  MoreHorizontal,
  Download,
  Copy,
  Pencil,
  FolderInput,
  Archive as ArchiveIcon,
  Trash2,
  Star,
} from "lucide-react";
import {
  AppCard,
  AppBadge,
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
  AppCheckbox,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { MEDIA_TYPE_CONFIG, MEDIA_STATUS_CONFIG } from "../constants";
import type { MediaAsset } from "../types";

interface MediaCardProps {
  asset: MediaAsset;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  onClick?: (asset: MediaAsset) => void;
  onFavorite?: (asset: MediaAsset) => void;
  onRename?: (asset: MediaAsset) => void;
  onMove?: (asset: MediaAsset) => void;
  onDuplicate?: (asset: MediaAsset) => void;
  onDownload?: (asset: MediaAsset) => void;
  onArchive?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  image: Image,
  audio: Music,
  document: FileText,
  pdf: FileText,
  zip: Archive,
  file: File,
};

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MediaCard({
  asset,
  selected,
  onSelect,
  onClick,
  onFavorite,
  onRename,
  onMove,
  onDuplicate,
  onDownload,
  onArchive,
  onDelete,
}: MediaCardProps) {
  const typeConfig = MEDIA_TYPE_CONFIG[asset.type] ?? MEDIA_TYPE_CONFIG.file;
  const statusConfig = MEDIA_STATUS_CONFIG[asset.status] ?? MEDIA_STATUS_CONFIG.pending;
  const TypeIcon = typeIcons[asset.type] ?? File;

  const handleClick = useCallback(() => onClick?.(asset), [asset, onClick]);
  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(asset.id, !selected);
    },
    [asset.id, selected, onSelect],
  );

  return (
    <AppCard
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        selected && "ring-2 ring-primary ring-offset-2",
        asset.status === "failed" && "ring-1 ring-destructive/30",
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute end-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <AppCheckbox
          checked={selected}
          onClick={handleSelect}
          className="border-white/80 bg-background/80 backdrop-blur-sm"
        />
      </div>

      {/* Favorite indicator */}
      {asset.favorite && (
        <div className="absolute end-2 bottom-2 z-10">
          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
        </div>
      )}

      {/* Thumbnail / Icon */}
      <div
        className={cn(
          "flex aspect-video items-center justify-center",
          asset.thumbnailUrl || (asset.type === "image" && asset.cdnUrl)
            ? "bg-muted/20"
            : "bg-gradient-to-br from-muted/50 to-muted",
        )}
      >
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.title ?? asset.originalName ?? ""}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : asset.type === "image" && asset.cdnUrl ? (
          <img
            src={asset.cdnUrl}
            alt={asset.title ?? asset.originalName ?? ""}
            className="h-full w-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <TypeIcon className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-[10px] font-medium uppercase text-muted-foreground/30">
              {asset.extension ?? typeConfig.label}
            </span>
          </div>
        )}

        {/* Duration overlay */}
        {asset.duration > 0 && (
          <div className="absolute bottom-2 start-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {formatDuration(asset.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 p-3">
        <div className="flex items-start gap-2">
          <p className="flex-1 truncate text-sm font-medium">
            {asset.title ?? asset.originalName ?? "بدون اسم"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatSize(asset.size)}</span>
          {asset.extension && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="uppercase">{asset.extension}</span>
            </>
          )}
          <span className="me-auto" />
          <AppBadge
            variant="outline"
            className={cn(
              "h-4 px-1 text-[8px] font-medium",
              statusConfig.color === "success" && "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
              statusConfig.color === "warning" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
              statusConfig.color === "destructive" && "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
            )}
          >
            {statusConfig.label}
          </AppBadge>
        </div>
      </div>

      {/* Hover menu */}
      <div className="absolute start-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <AppButton
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onClick={(e: any) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </AppButton>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="start" className="w-44">
            {onDownload && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onDownload(asset); }}>
                <Download className="h-4 w-4" />
                تحميل
              </AppDropdownMenuItem>
            )}
            {onRename && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onRename(asset); }}>
                <Pencil className="h-4 w-4" />
                إعادة تسمية
              </AppDropdownMenuItem>
            )}
            {onDuplicate && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onDuplicate(asset); }}>
                <Copy className="h-4 w-4" />
                نسخ
              </AppDropdownMenuItem>
            )}
            {onMove && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onMove(asset); }}>
                <FolderInput className="h-4 w-4" />
                نقل
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuSeparator />
            {onFavorite && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onFavorite(asset); }}>
                <Star className="h-4 w-4" />
                {asset.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              </AppDropdownMenuItem>
            )}
            {onArchive && (
              <AppDropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onArchive(asset); }}>
                <ArchiveIcon className="h-4 w-4" />
                أرشفة
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuSeparator />
            {onDelete && (
              <AppDropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e: any) => { e.stopPropagation(); onDelete(asset); }}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </AppDropdownMenuItem>
            )}
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </div>
    </AppCard>
  );
}

export { MediaCard };
