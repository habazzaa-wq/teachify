"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  FileType,
  FolderOpen,
  Globe,
  GripVertical,
  Headphones,
  Link,
  Lock,
  Monitor,
  Pencil,
  Puzzle,
  RotateCcw,
  Trash2,
  Video,
  Award,
  XCircle,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
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

function MiniAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      className="nova-action-chip"
      data-tone={tone}
      disabled={disabled || !onClick}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
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
  const isArchived = item.status === "archived";
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} د` : "—";

  return (
    <motion.div
      data-content-id={item.id}
      data-selected={isSelected}
      role="listitem"
      aria-label={item.title}
      tabIndex={isSelected ? 0 : -1}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="nova-timeline-item"
    >
      <span className="nova-step-bubble">{String(order).padStart(2, "0")}</span>
      <div
        className="nova-story-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
        onClick={() => onSelect(item.id)}
        onKeyDown={handleKeyDown}
        draggable
        onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, item)}
        onDragOver={(e) => onDragOver?.(e as unknown as React.DragEvent, item)}
        onDrop={(e) => onDrop?.(e as unknown as React.DragEvent, item)}
      >
        <div className="nova-story-card-head">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", meta.className)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="nova-mini-label">{meta.label}</span>
              <span className="block truncate text-sm font-extrabold text-studio-fg">{item.title}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StudioStatusBadge status={item.status} />
            <span className="nova-drag-handle" aria-hidden="true">
              <GripVertical className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="nova-story-card-body">
          <span>
            <span className="nova-mini-label">المدة</span>
            <span className="nova-mini-value">{displayDuration}</span>
          </span>
          <span>
            <span className="nova-mini-label">الظهور</span>
            <span className="nova-mini-value">
              {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-studio-fg-muted">
            {item.freePreview && <Globe className="h-3.5 w-3.5 text-studio-success" aria-label="معاينة مجانية" />}
            {item.locked && <Lock className="h-3.5 w-3.5 text-studio-warning" aria-label="مقفل" />}
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>

        <div className="nova-action-strip border-t border-dashed border-studio-border px-3 py-3">
          <MiniAction icon={Pencil} label="تعديل" onClick={() => onEdit?.(item)} />
          <MiniAction icon={Copy} label="نسخ" onClick={() => onDuplicate?.(item)} />
          {!isPublished && !isArchived && <MiniAction icon={CheckCircle} label="نشر" onClick={() => onPublish?.(item)} />}
          {isPublished && <MiniAction icon={XCircle} label="إلغاء النشر" onClick={() => onArchive?.(item)} />}
          {!isArchived && <MiniAction icon={Archive} label="أرشفة" onClick={() => onArchive?.(item)} />}
          {isArchived && <MiniAction icon={RotateCcw} label="استعادة" onClick={() => onRestore?.(item)} />}
          <MiniAction
            icon={Globe}
            label={item.freePreview ? "إيقاف المعاينة" : "معاينة مجانية"}
            onClick={() => onToggleFreePreview?.(item)}
          />
          <MiniAction icon={ArrowUp} label="أعلى" onClick={onMoveUp} disabled={!onMoveUp} />
          <MiniAction icon={ArrowDown} label="أسفل" onClick={onMoveDown} disabled={!onMoveDown} />
          <MiniAction icon={Trash2} label="حذف" tone="danger" onClick={() => onDelete?.(item)} />
        </div>
      </div>
    </motion.div>
  );
});

export { CourseStudioContentItem };
