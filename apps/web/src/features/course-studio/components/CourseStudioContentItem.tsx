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
  CalendarDays,
  ArrowUp,
  ArrowDown,
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
  session: CalendarDays,
};

const TYPE_META: Record<ContentItemType, { label: string; className: string }> = {
  video: { label: "فيديو", className: "text-secondary bg-secondary/10" },
  pdf: { label: "PDF", className: "text-red-500 bg-red-500/10" },
  exam: { label: "اختبار", className: "text-emerald-500 bg-emerald-500/10" },
  assignment: { label: "واجب", className: "text-orange-500 bg-orange-500/10" },
  resource: { label: "مورد", className: "text-cyan-500 bg-cyan-500/10" },
  audio: { label: "صوت", className: "text-pink-500 bg-pink-500/10" },
  live: { label: "جلسة مباشرة", className: "text-rose-500 bg-rose-500/10" },
  scorm: { label: "SCORM", className: "text-indigo-500 bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", className: "text-blue-500 bg-blue-500/10" },
  certificate: { label: "شهادة", className: "text-yellow-500 bg-yellow-500/10" },
  session: { label: "جلسة", className: "text-teal-500 bg-teal-500/10" },
};

interface CourseStudioContentItemProps {
  item: ContentItem;
  order: number;
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CourseStudioContentItem = memo(function CourseStudioContentItem({
  item,
  order,
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
  onMoveUp,
  onMoveDown,
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
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const isPublished = item.status === "published";
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} د` : "—";

  return (
    <motion.div
      data-content-id={item.id}
      role="listitem"
      aria-selected={isSelected}
      aria-label={item.title}
      tabIndex={isSelected ? 0 : -1}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      data-selected={isSelected}
      className={cn(
        "atlas-table-row cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-inset",
      )}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, item)}
      onDragOver={(e) => onDragOver?.(e as unknown as React.DragEvent, item)}
      onDrop={(e) => onDrop?.(e as unknown as React.DragEvent, item)}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="atlas-row-index">{order}</span>
        <span className="hidden shrink-0 cursor-grab text-studio-fg-subtle hoverable:block" aria-hidden="true">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className={cn("atlas-row-icon shrink-0", meta.className)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-studio-fg">{item.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-studio-fg-muted">
            {item.freePreview && <Globe className="h-3 w-3 text-studio-success" aria-label="معاينة مجانية" />}
            {item.locked && <Lock className="h-3 w-3 text-studio-warning" aria-label="مقفل" />}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
            </span>
          </span>
        </span>
      </div>

      <span className="atlas-row-meta text-xs text-studio-fg-muted">{meta.label}</span>
      <span className="atlas-row-meta flex items-center gap-1 text-xs text-studio-fg-muted">
        <Clock className="h-3 w-3" />
        {displayDuration}
      </span>
      <span className="atlas-row-meta"><StudioStatusBadge status={item.status} /></span>

      <div className="atlas-row-actions">
        {(onMoveUp || onMoveDown) && (
          <div className="flex shrink-0 flex-col gap-0.5 lg:hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!onMoveUp}
              aria-label="تحريك المحتوى لأعلى"
              className="flex h-6 w-7 items-center justify-center rounded-md bg-studio-soft text-studio-fg-muted hover:bg-studio-accent-soft hover:text-studio-accent disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!onMoveDown}
              aria-label="تحريك المحتوى لأسفل"
              className="flex h-6 w-7 items-center justify-center rounded-md bg-studio-soft text-studio-fg-muted hover:bg-studio-accent-soft hover:text-studio-accent disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="atlas-icon-btn flex h-9 w-9 shrink-0 items-center justify-center border border-studio-border bg-studio-surface"
              aria-label="خيارات المحتوى"
            >
              <MoreHorizontal className="h-4 w-4" />
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
                <AppDropdownMenuItem onClick={() => onDelete(item)} className="text-studio-danger focus:text-studio-danger">
                  <Trash2 className="h-4 w-4" />
                  حذف
                </AppDropdownMenuItem>
              </>
            )}
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </div>
    </motion.div>
  );
});

export { CourseStudioContentItem };
