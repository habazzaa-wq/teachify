"use client";

import { useCallback, useEffect, useRef, useState, memo, createElement } from "react";
import { motion } from "framer-motion";
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
  Pin,
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
  onSelect?: (id: number, selected: boolean, e?: React.MouseEvent) => void;
  onClick?: (asset: MediaAsset) => void;
  onFavorite?: (asset: MediaAsset) => void;
  onRename?: (asset: MediaAsset) => void;
  onMove?: (asset: MediaAsset) => void;
  onDuplicate?: (asset: MediaAsset) => void;
  onDownload?: (asset: MediaAsset) => void;
  onArchive?: (asset: MediaAsset) => void;
  onPin?: (asset: MediaAsset) => void;
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

function resolveTypeIcon(type: string): React.ComponentType<{ className?: string }> {
  return typeIcons[type] ?? File;
}

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

/**
 * LazyThumbnail — defers loading the thumbnail until the card scrolls into view.
 * Uses IntersectionObserver for performance on large media grids.
 */
function LazyThumbnail({ asset }: { asset: MediaAsset }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = asset.thumbnailUrl ?? (asset.type === "image" ? asset.cdnUrl : null);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  if (!src) {
    const IconComponent = resolveTypeIcon(asset.type);
    return (
      <div className="flex flex-col items-center gap-1">
        {createElement(IconComponent, { className: "h-8 w-8 text-muted-foreground/50" })}
        <span className="text-[10px] font-medium uppercase text-muted-foreground/30">
          {asset.extension ?? typeConfigLabel(asset)}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-full w-full">
      {visible && (
        <img
          src={src}
          alt={asset.title ?? asset.originalName ?? ""}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}

function typeConfigLabel(asset: MediaAsset): string {
  return MEDIA_TYPE_CONFIG[asset.type]?.label ?? "ملف";
}

function MediaCardBase({
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
  onPin,
  onDelete,
}: MediaCardProps) {
  const statusConfig = MEDIA_STATUS_CONFIG[asset.status] ?? MEDIA_STATUS_CONFIG.pending;

  const handleClick = useCallback(() => onClick?.(asset), [asset, onClick]);
  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(asset.id, !selected, e);
    },
    [asset.id, selected, onSelect],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative",
        selected && "z-10",
      )}
    >
    <AppCard
      className={cn(
        "relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg",
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

      {/* Pinned indicator */}
      {asset.pinned && (
        <div className="absolute start-2 bottom-2 z-10">
          <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
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
        <LazyThumbnail asset={asset} />

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
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </AppButton>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="start" className="w-44">
            {onDownload && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(asset); }}>
                <Download className="h-4 w-4" />
                تحميل
              </AppDropdownMenuItem>
            )}
            {onRename && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(asset); }}>
                <Pencil className="h-4 w-4" />
                إعادة تسمية
              </AppDropdownMenuItem>
            )}
            {onDuplicate && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(asset); }}>
                <Copy className="h-4 w-4" />
                نسخ
              </AppDropdownMenuItem>
            )}
            {onMove && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(asset); }}>
                <FolderInput className="h-4 w-4" />
                نقل
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuSeparator />
            {onFavorite && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onFavorite(asset); }}>
                <Star className="h-4 w-4" />
                {asset.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              </AppDropdownMenuItem>
            )}
            {onArchive && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(asset); }}>
                <ArchiveIcon className="h-4 w-4" />
                أرشفة
              </AppDropdownMenuItem>
            )}
            {onPin && (
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(asset); }}>
                <Pin className="h-4 w-4" />
                {asset.pinned ? "إلغاء التثبيت" : "تثبيت"}
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuSeparator />
            {onDelete && (
              <AppDropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </AppDropdownMenuItem>
            )}
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </div>
    </AppCard>
    </motion.div>
  );
}

export const MediaCard = memo(MediaCardBase);
export default MediaCard;
