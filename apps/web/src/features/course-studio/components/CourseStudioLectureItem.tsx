"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Clock,
  Layers,
  FileText,
  ChevronDown,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Copy,
  CheckCircle,
  Archive,
  Trash2,
  RotateCcw,
  XCircle,
  Plus,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import { CourseStudioSectionItem } from "./CourseStudioSectionItem";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioLectureItemProps {
  lecture: CourseModule;
  sections?: CourseSection[];
  isSelected: boolean;
  isExpanded: boolean;
  selectedSectionId?: string | null;
  onSelect: (id: string) => void;
  onToggle: () => void;
  onEdit: (lecture: CourseModule) => void;
  onPublish: (lecture: CourseModule) => void;
  onArchive: (lecture: CourseModule) => void;
  onDuplicate: (lecture: CourseModule) => void;
  onDelete: (lecture: CourseModule) => void;
  onRestore: (lecture: CourseModule) => void;
  onSelectSection?: (id: string) => void;
  onEditSection?: (section: CourseSection) => void;
  onPublishSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onAddSection?: () => void;
  onDragSectionStart?: (e: React.DragEvent, section: CourseSection) => void;
  onDragSectionOver?: (e: React.DragEvent, section: CourseSection) => void;
  onDropSection?: (e: React.DragEvent, section: CourseSection) => void;
  onDragStart?: (e: React.DragEvent, lecture: CourseModule) => void;
  onDragOver?: (e: React.DragEvent, lecture: CourseModule) => void;
  onDrop?: (e: React.DragEvent, lecture: CourseModule) => void;
}

const CourseStudioLectureItem = memo(function CourseStudioLectureItem({
  lecture,
  sections,
  isSelected,
  isExpanded,
  selectedSectionId,
  onSelect,
  onToggle,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onSelectSection,
  onEditSection,
  onPublishSection,
  onArchiveSection,
  onDuplicateSection,
  onDeleteSection,
  onRestoreSection,
  onAddSection,
  onDragSectionStart,
  onDragSectionOver,
  onDropSection,
  onDragStart,
  onDragOver,
  onDrop,
}: CourseStudioLectureItemProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(lecture.id);
      }
    },
    [lecture.id, onSelect],
  );

  const isDeleted = !!lecture.deletedAt;
  const isPublished = lecture.status === "published";

  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        data-lecture-id={lecture.id}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isExpanded}
        aria-label={lecture.title}
        tabIndex={isSelected ? 0 : -1}
        className={cn(
          "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1 focus-visible:ring-offset-studio-surface",
          isSelected
            ? "bg-studio-accent-soft text-studio-accent"
            : "hover:bg-studio-soft text-studio-fg",
          isDeleted && "opacity-50",
        )}
        onClick={() => { onSelect(lecture.id); if (!isExpanded) onToggle(); }}
        onKeyDown={handleKeyDown}
        draggable
        onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, lecture)}
        onDragOver={(e) => onDragOver?.(e as unknown as React.DragEvent, lecture)}
        onDrop={(e) => onDrop?.(e as unknown as React.DragEvent, lecture)}
      >
        <div
          className="flex shrink-0 cursor-grab items-center opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <GripVertical className="h-3.5 w-3.5 text-studio-fg-subtle" />
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-studio-fg-subtle hover:bg-studio-soft transition-colors"
          aria-label={isExpanded ? "طي المحاضرة" : "توسيع المحاضرة"}
          tabIndex={-1}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.div>
        </button>

        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isSelected
              ? "bg-studio-accent text-studio-accent-fg"
              : "bg-studio-soft text-studio-fg-muted",
          )}
        >
          <BookOpen className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium leading-tight">
            {lecture.title}
          </span>
          <div className="flex items-center gap-2">
            <StudioStatusBadge status={lecture.status} />
            {lecture.estimatedDuration && (
              <span className="flex items-center gap-1 text-[10px] text-studio-fg-muted">
                <Clock className="h-3 w-3" />
                {lecture.estimatedDuration} د
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-studio-fg-subtle">
          <Layers className="h-3 w-3" />
          <span>{lecture.sectionsCount}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-studio-fg-subtle">
          <FileText className="h-3 w-3" />
          <span>0</span>
        </div>

        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-studio-soft group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
              aria-label="خيارات المحاضرة"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="end" className="w-44">
            <AppDropdownMenuItem onClick={() => onEdit(lecture)}>
              <Pencil className="h-4 w-4" />
              تعديل
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onClick={() => onDuplicate(lecture)}>
              <Copy className="h-4 w-4" />
              نسخ
            </AppDropdownMenuItem>
            <AppDropdownMenuSeparator />
            {!isPublished && !isDeleted && (
              <AppDropdownMenuItem onClick={() => onPublish(lecture)}>
                <CheckCircle className="h-4 w-4" />
                نشر
              </AppDropdownMenuItem>
            )}
            {isPublished && !isDeleted && (
              <AppDropdownMenuItem onClick={() => onArchive(lecture)}>
                <XCircle className="h-4 w-4" />
                إلغاء النشر
              </AppDropdownMenuItem>
            )}
            {!isDeleted && (
              <AppDropdownMenuItem onClick={() => onArchive(lecture)}>
                <Archive className="h-4 w-4" />
                أرشفة
              </AppDropdownMenuItem>
            )}
            {isDeleted && (
              <AppDropdownMenuItem onClick={() => onRestore(lecture)}>
                <RotateCcw className="h-4 w-4" />
                استعادة
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              onClick={() => onDelete(lecture)}
              className="text-studio-danger focus:text-studio-danger"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </AppDropdownMenuItem>
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </motion.div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`sections-${lecture.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 py-1">
              {sections && sections.length > 0 ? (
                sections.map((section) => (
                  <CourseStudioSectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    onSelect={onSelectSection ?? (() => {})}
                    onEdit={onEditSection ?? (() => {})}
                    onPublish={onPublishSection ?? (() => {})}
                    onArchive={onArchiveSection ?? (() => {})}
                    onDuplicate={onDuplicateSection ?? (() => {})}
                    onDelete={onDeleteSection ?? (() => {})}
                    onRestore={onRestoreSection ?? (() => {})}
                    onDragStart={onDragSectionStart}
                    onDragOver={onDragSectionOver}
                    onDrop={onDropSection}
                  />
                ))
              ) : (
                <div className="px-4 py-2 ms-6">
                  <span className="text-xs text-studio-fg-muted">
                    لا توجد أقسام بعد
                  </span>
                </div>
              )}
              {onAddSection && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAddSection(); }}
                  className="flex w-full items-center gap-2 px-4 py-1.5 ms-6 rounded-lg text-xs text-studio-fg-muted hover:text-studio-accent hover:bg-studio-soft transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  إضافة قسم
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export { CourseStudioLectureItem };
