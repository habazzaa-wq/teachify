"use client";

import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListMusic } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { CourseStudioContentItem } from "./CourseStudioContentItem";
import { cn } from "@/lib/cn";
import type { ContentItem } from "@/features/course-content/types";

interface CourseStudioContentListProps {
  items: ContentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddContent?: () => void;
  onEdit?: (item: ContentItem) => void;
  onPublish?: (item: ContentItem) => void;
  onArchive?: (item: ContentItem) => void;
  onDuplicate?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onReorder?: (items: ContentItem[], fromIndex: number, toIndex: number) => void;
  className?: string;
}

function CourseStudioContentList({
  items,
  selectedId,
  onSelect,
  onAddContent,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onToggleFreePreview,
  onReorder,
  className,
}: CourseStudioContentListProps) {
  const dragItem = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: ContentItem) => {
      dragItem.current = items.findIndex((i) => i.id === item.id);
      e.dataTransfer.effectAllowed = "move";
    },
    [items],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, item: ContentItem) => {
      e.preventDefault();
      if (dragItem.current === null) return;
      const toIndex = items.findIndex((i) => i.id === item.id);
      if (dragItem.current === toIndex) return;
      onReorder?.(items, dragItem.current, toIndex);
      dragItem.current = null;
    },
    [items, onReorder],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-studio-fg">
          <ListMusic className="h-4 w-4 text-studio-accent" />
          وحدات المحتوى
          <span className="rounded-full bg-studio-soft px-2 py-0.5 text-[11px] font-semibold text-studio-fg-muted">
            {items.length}
          </span>
        </h3>
        {onAddContent && (
          <StudioButton variant="ghost" size="sm" onClick={onAddContent} icon={<Plus className="h-3.5 w-3.5" />}>
            إضافة محتوى
          </StudioButton>
        )}
      </div>

      <div className="atlas-table" role="list" aria-label="قائمة المحتوى">
        <div className="atlas-table-head" aria-hidden="true">
          <span>العنوان</span>
          <span>النوع</span>
          <span>المدة</span>
          <span>الحالة</span>
          <span className="text-end">إجراءات</span>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <CourseStudioContentItem
              key={item.id}
              item={item}
              order={index + 1}
              isSelected={selectedId === item.id}
              onSelect={onSelect}
              onEdit={onEdit}
              onPublish={onPublish}
              onArchive={onArchive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onRestore={onRestore}
              onToggleFreePreview={onToggleFreePreview}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMoveUp={index > 0 && onReorder ? () => onReorder(items, index, index - 1) : undefined}
              onMoveDown={index < items.length - 1 && onReorder ? () => onReorder(items, index, index + 1) : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && onAddContent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="atlas-empty-card flex flex-col items-center gap-3 p-8 text-center"
        >
          <div className="atlas-hero-icon h-12 w-12">
            <ListMusic className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-studio-fg">لم يتم إضافة محتوى بعد</h4>
            <p className="mt-1 text-xs text-studio-fg-muted">أضف فيديوهات، ملفات PDF، اختبارات، أو أي نوع من المحتوى.</p>
          </div>
          <StudioButton variant="primary" size="sm" onClick={onAddContent} icon={<Plus className="h-3.5 w-3.5" />}>
            إضافة محتوى
          </StudioButton>
        </motion.div>
      )}
    </div>
  );
}

export { CourseStudioContentList };
