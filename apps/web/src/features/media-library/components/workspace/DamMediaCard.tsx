"use client";

import { useState, useCallback, useMemo, useRef, useEffect, memo, createElement } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Heart,
  Download,
  Copy,
  Pencil,
  FolderInput,
  Archive as ArchiveIcon,
  Trash2,
  Pin,
  ExternalLink,
  Check,
  Presentation,
  Table,
  Link as LinkIcon,
} from "lucide-react";
import {
  StudioContextMenu,
} from "@/components/studio";
import type { StudioContextMenuItem } from "@/components/studio";
import { cn } from "@/lib/cn";
import { MEDIA_TYPE_CONFIG, MEDIA_STATUS_CONFIG } from "../../constants";
import type { MediaAsset } from "../../types";

interface MediaCardProps {
  asset: MediaAsset;
  selected?: boolean;
  viewMode?: "grid" | "list" | "compact" | "large";
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
  presentation: Presentation,
  spreadsheet: Table,
  link: LinkIcon,
  file: File,
};

// File-type hues stay distinct while deriving from the brand chart palette
// and studio status tokens (never from hardcoded Tailwind palette colors).
const typeColors: Record<string, string> = {
  video: "from-chart-1/20 to-chart-1/5",
  image: "from-chart-2/20 to-chart-2/5",
  audio: "from-chart-3/20 to-chart-3/5",
  document: "from-studio-warning/20 to-studio-warning/5",
  pdf: "from-studio-danger/20 to-studio-danger/5",
  zip: "from-studio-soft to-studio-soft/40",
  presentation: "from-chart-4/20 to-chart-4/5",
  spreadsheet: "from-studio-success/20 to-studio-success/5",
  link: "from-studio-info/20 to-studio-info/5",
  file: "from-studio-soft to-studio-soft/40",
};

const typeIconColors: Record<string, string> = {
  video: "text-chart-1",
  image: "text-chart-2",
  audio: "text-chart-3",
  document: "text-studio-warning",
  pdf: "text-studio-danger",
  zip: "text-studio-fg-muted",
  presentation: "text-chart-4",
  spreadsheet: "text-studio-success",
  link: "text-studio-info",
  file: "text-studio-fg-muted",
};

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function LazyThumbnail({ asset, className }: { asset: MediaAsset; className?: string }) {
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
    const IconComponent = typeIcons[asset.type] ?? File;
    const iconColor = typeIconColors[asset.type] ?? "text-studio-fg-muted";
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br", typeColors[asset.type] ?? typeColors.file)}>
          {createElement(IconComponent, { className: cn("h-6 w-6", iconColor) })}
        </div>
        <span className="text-[10px] font-medium uppercase text-studio-fg-muted/50">
          {asset.extension ?? MEDIA_TYPE_CONFIG[asset.type]?.label ?? "FILE"}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative h-full w-full", className)}>
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

function MediaCardBase({
  asset,
  selected,
  viewMode = "grid",
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
  const effectiveIsProcessing = asset.type !== "video" && asset.cdnUrl ? false : (asset.isProcessing || asset.status === "processing");
  const statusConfig = MEDIA_STATUS_CONFIG[effectiveIsProcessing ? "processing" : asset.status] ?? MEDIA_STATUS_CONFIG.pending;
  const isProcessing = effectiveIsProcessing;
  const isFailed = !isProcessing && asset.status === "failed";
  const hasUsages = asset.usages && asset.usages.length > 0;

  const lastClickTime = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime.current < 300) {
        lastClickTime.current = 0;
        onClick?.(asset);
      } else {
        lastClickTime.current = now;
        onSelect?.(asset.id, !selected, e);
      }
    },
    [asset, selected, onClick, onSelect],
  );
  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(asset.id, !selected, e);
    },
    [asset.id, selected, onSelect],
  );

  const contextMenuItems: StudioContextMenuItem[] = useMemo(() => {
    const items: StudioContextMenuItem[] = [];
    if (onDownload) items.push({ label: "تحميل", icon: <Download className="h-4 w-4" />, onSelect: () => onDownload(asset) });
    if (onRename) items.push({ label: "إعادة تسمية", icon: <Pencil className="h-4 w-4" />, onSelect: () => onRename(asset) });
    if (onDuplicate) items.push({ label: "نسخ", icon: <Copy className="h-4 w-4" />, onSelect: () => onDuplicate(asset) });
    if (onMove) items.push({ label: "نقل", icon: <FolderInput className="h-4 w-4" />, onSelect: () => onMove(asset) });
    items.push({ label: "", separator: true });
    if (onFavorite)
      items.push({
        label: asset.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة",
        icon: <Heart className="h-4 w-4" />,
        onSelect: () => onFavorite(asset),
      });
    if (onPin)
      items.push({
        label: asset.pinned ? "إلغاء التثبيت" : "تثبيت",
        icon: <Pin className="h-4 w-4" />,
        onSelect: () => onPin(asset),
      });
    if (onArchive) items.push({ label: "أرشفة", icon: <ArchiveIcon className="h-4 w-4" />, onSelect: () => onArchive(asset) });
    items.push({ label: "", separator: true });
    if (onDelete)
      items.push({
        label: "حذف",
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onSelect: () => onDelete(asset),
      });
    return items.filter((i) => i.label !== "" || i.separator);
  }, [asset, onDownload, onRename, onDuplicate, onMove, onFavorite, onPin, onArchive, onDelete]);

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
      >
        <StudioContextMenu items={contextMenuItems}>
          <div
            onClick={handleClick}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg border p-2 text-start transition-all duration-150",
              "hover:bg-studio-hover/50",
              selected && "border-studio-accent bg-studio-accent/30 ring-1 ring-studio-accent",
              isFailed && "border-studio-danger/30",
            )}
            data-selected={selected || undefined}
            role="row"
          >
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br overflow-hidden"
              style={{}}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", typeColors[asset.type] ?? typeColors.file)} />
              <LazyThumbnail asset={asset} className="absolute inset-0" />
              {!asset.thumbnailUrl && !(asset.type === "image" && asset.cdnUrl) && (
                <div className="relative z-10">
                  {createElement(typeIcons[asset.type] ?? File, {
                    className: cn("h-5 w-5", typeIconColors[asset.type] ?? "text-studio-fg-muted"),
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{asset.title ?? asset.originalName ?? "بدون اسم"}</p>
              <div className="flex items-center gap-2 text-[11px] text-studio-fg-muted">
                <span>{formatSize(asset.size)}</span>
                {asset.extension && (
                  <>
                    <span className="text-studio-fg-muted/30">·</span>
                    <span className="uppercase">{asset.extension}</span>
                  </>
                )}
                {asset.duration > 0 && (
                  <>
                    <span className="text-studio-fg-muted/30">·</span>
                    <span>{formatDuration(asset.duration)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {asset.pinned && (
                <Pin className="h-3 w-3 fill-studio-warning text-studio-warning" />
              )}
              {asset.favorite && (
                <Heart className="h-3 w-3 fill-studio-danger text-studio-danger" />
              )}
              {hasUsages && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-studio-accent/50 px-1.5 py-0.5 text-[10px] font-medium text-studio-accent-fg">
                  <LinkIcon className="h-2.5 w-2.5" />
                  {asset.usages.length}
                </span>
              )}
              {isProcessing && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-studio-accent border-t-transparent" />
              )}
              {isFailed && (
                <span className="rounded-full bg-studio-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-studio-danger">
                  فشل
                </span>
              )}
            </div>

            <button
              onClick={handleSelect}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all",
                selected
                  ? "border-studio-accent bg-studio-accent text-studio-accent-fg"
                  : "border-studio-border opacity-0 group-hover:opacity-100",
              )}
              aria-label={selected ? "إلغاء التحديد" : "تحديد"}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        </StudioContextMenu>
      </motion.div>
    );
  }

  if (viewMode === "compact") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
      >
        <StudioContextMenu items={contextMenuItems}>
          <div
            onClick={handleClick}
            className={cn(
              "group relative flex h-16 w-full items-center gap-2 rounded-lg border p-2 text-start transition-all duration-150",
              "hover:bg-studio-hover/50",
              selected && "border-studio-accent bg-studio-accent/30 ring-1 ring-studio-accent",
            )}
            data-selected={selected || undefined}
          >
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br", typeColors[asset.type] ?? typeColors.file)}>
              {createElement(typeIcons[asset.type] ?? File, {
                className: cn("h-5 w-5", typeIconColors[asset.type] ?? "text-studio-fg-muted"),
              })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{asset.title ?? asset.originalName ?? "بدون اسم"}</p>
              <p className="text-[10px] text-studio-fg-muted">{formatSize(asset.size)}</p>
            </div>
            <button
              onClick={handleSelect}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                selected
                  ? "border-studio-accent bg-studio-accent text-studio-accent-fg"
                  : "border-studio-border opacity-0 group-hover:opacity-100",
              )}
            >
              {selected && <Check className="h-3 w-3" />}
            </button>
          </div>
        </StudioContextMenu>
      </motion.div>
    );
  }

  // Grid / Large view
  const isLarge = viewMode === "large";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn("group relative", selected && "z-10")}
    >
      <StudioContextMenu items={contextMenuItems}>
          <div
            onClick={handleClick}
            className={cn(
              "relative w-full cursor-pointer overflow-hidden rounded-xl border border-studio-border bg-studio-panel transition-all duration-200",
              "hover:shadow-md",
              selected && "ring-2 ring-studio-accent ring-offset-2 ring-offset-studio-bg",
              isFailed && "ring-1 ring-destructive/30",
            )}
            data-selected={selected || undefined}
          >
          {/* Selection checkbox */}
          <div className="absolute end-2 top-2 z-10">
            <button
              onClick={handleSelect}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border transition-all duration-150",
                selected
                  ? "border-studio-accent bg-studio-accent text-studio-accent-fg opacity-100"
                  : "border-studio-border bg-studio-surface/60 text-transparent opacity-0 backdrop-blur-sm group-hover:opacity-100",
              )}
              aria-label={selected ? "إلغاء التحديد" : "تحديد"}
            >
              {selected ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <div className="h-3.5 w-3.5 rounded border border-current opacity-60" />
              )}
            </button>
          </div>

          {/* Badges top-left */}
          <div className="absolute start-2 top-2 z-10 flex items-center gap-1">
            {asset.pinned && (
              <div className="flex h-6 items-center gap-1 rounded-full bg-studio-warning/90 px-1.5 py-0.5 text-[10px] font-medium text-studio-warning-foreground backdrop-blur-sm">
                <Pin className="h-2.5 w-2.5" />
              </div>
            )}
            {asset.favorite && (
              <div className="flex h-6 items-center gap-1 rounded-full bg-studio-danger/90 px-1.5 py-0.5 text-[10px] font-medium text-studio-danger-foreground backdrop-blur-sm">
                <Heart className="h-2.5 w-2.5 fill-current" />
              </div>
            )}
            {hasUsages && (
              <div className="flex h-6 items-center gap-1 rounded-full bg-studio-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-studio-accent-fg backdrop-blur-sm">
                <LinkIcon className="h-2.5 w-2.5" />
                {asset.usages.length}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div
            className={cn(
              "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
              isLarge ? "aspect-[16/10]" : "aspect-video",
              typeColors[asset.type] ?? typeColors.file,
            )}
          >
            <LazyThumbnail asset={asset} />

            {/* Duration overlay */}
            {asset.duration > 0 && (
              <div className="absolute bottom-2 start-2 z-10 rounded-md bg-studio-overlay px-1.5 py-0.5 text-[10px] font-medium text-studio-glass-toolbar-fg backdrop-blur-sm">
                {formatDuration(asset.duration)}
              </div>
            )}

            {/* Resolution badge */}
            {asset.width && asset.height && (
              <div className="absolute bottom-2 end-2 z-10 rounded-md bg-studio-overlay px-1.5 py-0.5 text-[10px] font-medium text-studio-glass-toolbar-fg backdrop-blur-sm">
                {asset.width}×{asset.height}
              </div>
            )}

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-studio-overlay backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-studio-glass-toolbar-fg border-t-transparent" />
                  <span className="text-xs font-medium text-studio-glass-toolbar-fg">
                    {asset.processingProgress > 0 ? `${asset.processingProgress}%` : "معالجة..."}
                  </span>
                </div>
              </div>
            )}

            {/* Hover quick actions */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-transparent opacity-0 transition-all duration-200 group-hover:bg-studio-overlay group-hover:opacity-100">
              {onFavorite && (
                <button
                  onClick={(e) => { e.stopPropagation(); onFavorite(asset); }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-studio-surface/90 text-studio-fg shadow-lg transition-transform hover:scale-110",
                    asset.favorite && "text-studio-danger",
                  )}
                  title={asset.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                  <Heart className={cn("h-4 w-4", asset.favorite && "fill-current")} />
                </button>
              )}
              {onDownload && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-studio-surface/90 text-studio-fg shadow-lg transition-transform hover:scale-110"
                  title="تحميل"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              {asset.cdnUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(asset.cdnUrl!, "_blank"); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-studio-surface/90 text-studio-fg shadow-lg transition-transform hover:scale-110"
                  title="فتح"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {asset.title ?? asset.originalName ?? "بدون اسم"}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                statusConfig.color === "success" && "bg-studio-success/10 text-studio-success",
                statusConfig.color === "warning" && "bg-studio-warning/10 text-studio-warning",
                statusConfig.color === "destructive" && "bg-studio-danger/10 text-studio-danger",
                statusConfig.color === "info" && "bg-studio-info/10 text-studio-info",
                statusConfig.color === "secondary" && "bg-studio-soft text-studio-fg-muted",
              )}>
                {statusConfig.label}
              </span>
              <span className="text-[11px] text-studio-fg-muted">{formatSize(asset.size)}</span>
              {asset.extension && (
                <>
                  <span className="text-studio-fg-muted/30">·</span>
                  <span className="text-[11px] uppercase text-studio-fg-muted">{asset.extension}</span>
                </>
              )}
            </div>
            {isLarge && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-studio-fg-muted">
                {asset.uploader && <span>{asset.uploader.name}</span>}
                {asset.folder && (
                  <>
                    <span className="text-studio-fg-muted/30">·</span>
                    <span>{asset.folder.name}</span>
                  </>
                )}
                <span className="text-studio-fg-muted/30">·</span>
                <span>{formatDate(asset.createdAt)}</span>
              </div>
            )}
          </div>
          </div>
        </StudioContextMenu>
    </motion.div>
  );
}

export const DamMediaCard = memo(MediaCardBase);
export default DamMediaCard;
