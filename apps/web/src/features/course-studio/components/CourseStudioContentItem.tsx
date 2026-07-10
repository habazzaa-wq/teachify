"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Clock,
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  RotateCcw,
  Globe,
  Video,
  FileType,
  ClipboardList,
  FileText,
  FolderOpen,
  Headphones,
  Monitor,
  Puzzle,
  Link,
  Award,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_ICONS: Record<ContentItemType, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileType,
  exam: ClipboardList,
  assignment: FileText,
  resource: FolderOpen,
  audio: Headphones,
  live: Monitor,
  scorm: Puzzle,
  external_link: Link,
  certificate: Award,
};

const TYPE_COLORS: Record<ContentItemType, string> = {
  video: "text-secondary bg-secondary/10",
  pdf: "text-red-500 bg-red-500/10",
  exam: "text-emerald-500 bg-emerald-500/10",
  assignment: "text-orange-500 bg-orange-500/10",
  resource: "text-cyan-500 bg-cyan-500/10",
  audio: "text-pink-500 bg-pink-500/10",
  live: "text-rose-500 bg-rose-500/10",
  scorm: "text-indigo-500 bg-indigo-500/10",
  external_link: "text-blue-500 bg-blue-500/10",
  certificate: "text-yellow-500 bg-yellow-500/10",
};

interface CourseStudioContentItemProps {
  item: ContentItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (item: ContentItem) => void;
  onPublish?: (item: ContentItem) => void;
  onArchive?: (item: ContentItem) => void;
  onDuplicate?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onDragStart?: (e: React.DragEvent, item: ContentItem) => void;
  onDragOver?: (e: React.DragEvent, item: ContentItem) => void;
  onDrop?: (e: React.DragEvent, item: ContentItem) => void;
}

const CourseStudioContentItem = memo(function CourseStudioContentItem({
  item,
  isSelected,
  onSelect,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onToggleFreePreview,
  onDragStart,
  onDragOver,
  onDrop,
}: CourseStudioContentItemProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(item.id);
      }
    },
    [item.id, onSelect],
  );

  const Icon = TYPE_ICONS[item.type] ?? FolderOpen;
  const colorClass = TYPE_COLORS[item.type] ?? TYPE_COLORS.resource;
  const isPublished = item.status === "published";
  const displayDuration = item.duration
    ? `${Math.round(item.duration / 60)} د`
    : null;

  return (
    <div
      data-content-id={item.id}
      role="listitem"
      aria-selected={isSelected}
      aria-label={item.title}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        "group relative",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1 focus-visible:ring-offset-studio-surface",
      )}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={(e) => onDragStart?.(e, item)}
      onDragOver={(e) => onDragOver?.(e, item)}
      onDrop={(e) => onDrop?.(e, item)}
    >
      <motion.div
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
          isSelected
            ? "bg-studio-accent-soft text-studio-accent"
            : "hover:bg-studio-soft text-studio-fg",
        )}
      >
      <div
        className="flex shrink-0 cursor-grab items-center opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      >
        <GripVertical className="h-3 w-3 text-studio-fg-subtle" />
      </div>

      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium leading-tight">
          {item.title}
        </span>
        <div className="flex items-center gap-2">
          <StudioStatusBadge status={item.status} />
          {displayDuration && (
            <span className="flex items-center gap-1 text-[10px] text-studio-fg-muted">
              <Clock className="h-3 w-3" />
              {displayDuration}
            </span>
          )}
          {item.freePreview && (
            <Globe className="h-3 w-3 text-studio-success" aria-label="معاينة مجانية" />
          )}
          {item.locked && (
            <Lock className="h-3 w-3 text-studio-warning" aria-label="مقفل" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-studio-fg-subtle">
        <Eye className="h-3 w-3" />
        <span>{item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}</span>
      </div>

      <AppDropdownMenu>
        <AppDropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-studio-soft group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
            aria-label="خيارات المحتوى"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </AppDropdownMenuTrigger>
        <AppDropdownMenuContent align="end" className="w-44">
          {onEdit && (
            <AppDropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
              تعديل
            </AppDropdownMenuItem>
          )}
          {onDuplicate && (
            <AppDropdownMenuItem onClick={() => onDuplicate(item)}>
              <Copy className="h-4 w-4" />
              نسخ
            </AppDropdownMenuItem>
          )}
          {onToggleFreePreview && (
            <AppDropdownMenuItem onClick={() => onToggleFreePreview(item)}>
              <Globe className="h-4 w-4" />
              {item.freePreview ? "إيقاف المعاينة" : "تفعيل المعاينة"}
            </AppDropdownMenuItem>
          )}
          <AppDropdownMenuSeparator />
          {!isPublished && onPublish && (
            <AppDropdownMenuItem onClick={() => onPublish(item)}>
              <CheckCircle className="h-4 w-4" />
              نشر
            </AppDropdownMenuItem>
          )}
          {isPublished && onArchive && (
            <AppDropdownMenuItem onClick={() => onArchive(item)}>
              <XCircle className="h-4 w-4" />
              إلغاء النشر
            </AppDropdownMenuItem>
          )}
          {onArchive && (
            <AppDropdownMenuItem onClick={() => onArchive(item)}>
              <Archive className="h-4 w-4" />
              أرشفة
            </AppDropdownMenuItem>
          )}
          {onRestore && (
            <AppDropdownMenuItem onClick={() => onRestore(item)}>
              <RotateCcw className="h-4 w-4" />
              استعادة
            </AppDropdownMenuItem>
          )}
          {onDelete && (
            <>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem
                onClick={() => onDelete(item)}
                className="text-studio-danger focus:text-studio-danger"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </AppDropdownMenuItem>
            </>
          )}
        </AppDropdownMenuContent>
      </AppDropdownMenu>
      </motion.div>
    </div>
  );
});

export { CourseStudioContentItem };
