"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Clock,
  FileText,
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  Copy,
  CheckCircle,
  Archive,
  Trash2,
  RotateCcw,
  XCircle,
  Layers,
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
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioSectionItemProps {
  section: CourseSection;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (section: CourseSection) => void;
  onPublish: (section: CourseSection) => void;
  onArchive: (section: CourseSection) => void;
  onDuplicate: (section: CourseSection) => void;
  onDelete: (section: CourseSection) => void;
  onRestore: (section: CourseSection) => void;
  onDragStart?: (e: React.DragEvent, section: CourseSection) => void;
  onDragOver?: (e: React.DragEvent, section: CourseSection) => void;
  onDrop?: (e: React.DragEvent, section: CourseSection) => void;
}

const CourseStudioSectionItem = memo(function CourseStudioSectionItem({
  section,
  isSelected,
  onSelect,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onDragStart,
  onDragOver,
  onDrop,
}: CourseStudioSectionItemProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(section.id);
      }
    },
    [section.id, onSelect],
  );

  const isDeleted = !!section.deletedAt;
  const isPublished = section.status === "published";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      data-section-id={section.id}
      role="treeitem"
      aria-selected={isSelected}
      aria-label={section.title}
      aria-expanded={false}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 ms-6",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1 focus-visible:ring-offset-studio-surface",
        isSelected
          ? "bg-studio-accent-soft text-studio-accent"
          : "hover:bg-studio-soft text-studio-fg",
        isDeleted && "opacity-60 grayscale",
      )}
      onClick={() => onSelect(section.id)}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, section)}
      onDragOver={(e) => onDragOver?.(e as unknown as React.DragEvent, section)}
      onDrop={(e) => onDrop?.(e as unknown as React.DragEvent, section)}
    >
      <div
        className="flex shrink-0 cursor-grab items-center opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      >
        <GripVertical className="h-3 w-3 text-studio-fg-subtle" />
      </div>

      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isSelected
            ? "bg-studio-accent text-studio-accent-fg"
            : "bg-studio-soft text-studio-fg-muted",
        )}
      >
        <Layers className="h-3.5 w-3.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium leading-tight">
          {section.title}
        </span>
        <div className="flex items-center gap-2">
          <StudioStatusBadge status={section.status} />
          {section.durationMinutes && (
            <span className="flex items-center gap-1 text-[10px] text-studio-fg-muted">
              <Clock className="h-3 w-3" />
              {section.durationMinutes} د
            </span>
          )}
          {section.freePreview && (
            <Eye className="h-3 w-3 text-studio-success" aria-label="معاينة مجانية" />
          )}
          {section.locked && (
            <Lock className="h-3 w-3 text-studio-warning" aria-label="مقفل" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-studio-fg-subtle">
        <FileText className="h-3 w-3" />
        <span>{section.lessonsCount}</span>
      </div>

      {isDeleted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRestore(section);
          }}
          className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-studio-success/10 px-2 text-[10px] font-medium text-studio-success opacity-0 transition-opacity hover:bg-studio-success/20 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
          aria-label="استعادة القسم"
        >
          <RotateCcw className="h-3 w-3" />
          استعادة
        </button>
      )}

      <AppDropdownMenu>
        <AppDropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-studio-soft group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
            aria-label="خيارات القسم"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </AppDropdownMenuTrigger>
        <AppDropdownMenuContent align="end" className="w-44">
          <AppDropdownMenuItem onClick={() => onEdit(section)}>
            <Pencil className="h-4 w-4" />
            تعديل
          </AppDropdownMenuItem>
          <AppDropdownMenuItem onClick={() => onDuplicate(section)}>
            <Copy className="h-4 w-4" />
            نسخ
          </AppDropdownMenuItem>
          <AppDropdownMenuSeparator />
          {!isPublished && !isDeleted && (
            <AppDropdownMenuItem onClick={() => onPublish(section)}>
              <CheckCircle className="h-4 w-4" />
              نشر
            </AppDropdownMenuItem>
          )}
          {isPublished && !isDeleted && (
            <AppDropdownMenuItem onClick={() => onArchive(section)}>
              <XCircle className="h-4 w-4" />
              إلغاء النشر
            </AppDropdownMenuItem>
          )}
          {!isDeleted && (
            <AppDropdownMenuItem onClick={() => onArchive(section)}>
              <Archive className="h-4 w-4" />
              أرشفة
            </AppDropdownMenuItem>
          )}
          {isDeleted && (
            <AppDropdownMenuItem onClick={() => onRestore(section)}>
              <RotateCcw className="h-4 w-4" />
              استعادة
            </AppDropdownMenuItem>
          )}
          <AppDropdownMenuSeparator />
          <AppDropdownMenuItem
            onClick={() => onDelete(section)}
            className="text-studio-danger focus:text-studio-danger"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </AppDropdownMenuItem>
        </AppDropdownMenuContent>
      </AppDropdownMenu>
    </motion.div>
  );
});

export { CourseStudioSectionItem };
