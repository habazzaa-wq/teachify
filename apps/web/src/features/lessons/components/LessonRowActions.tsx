"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Trash2,
  Star,
  RotateCcw,
  CheckCircle,
  Archive,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  EyeOff,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { useCan } from "@/hooks";
import type { Lesson } from "../types";

interface LessonRowActionsProps {
  lesson: Lesson;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onToggleFeature: () => void;
  onToggleFreePreview: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const LessonRowActions = memo(function LessonRowActions({
  lesson,
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onToggleFeature,
  onToggleFreePreview,
  onRestore,
  onDelete,
  onMoveUp,
  onMoveDown,
}: LessonRowActionsProps) {
  const canCreate = useCan("lessons.create");
  const canUpdate = useCan("lessons.update");
  const canDelete = useCan("lessons.delete");
  const canPublish = useCan("lessons.publish");
  const canArchive = useCan("lessons.archive");
  const canFeature = useCan("lessons.feature");
  const canReorder = useCan("lessons.reorder");

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات الدرس"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض
        </AppDropdownMenuItem>
        {canUpdate && (
          <AppDropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            تعديل
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        {canReorder && onMoveUp && (
          <AppDropdownMenuItem onClick={onMoveUp}>
            <ArrowUp className="h-4 w-4" />
            رفع للأعلى
          </AppDropdownMenuItem>
        )}
        {canReorder && onMoveDown && (
          <AppDropdownMenuItem onClick={onMoveDown}>
            <ArrowDown className="h-4 w-4" />
            خفض للأسفل
          </AppDropdownMenuItem>
        )}
        {canPublish && lesson.status !== "published" && (
          <AppDropdownMenuItem onClick={onPublish}>
            <CheckCircle className="h-4 w-4" />
            نشر
          </AppDropdownMenuItem>
        )}
        {canArchive && lesson.status !== "archived" && (
          <AppDropdownMenuItem onClick={onArchive}>
            <Archive className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        )}
        {canUpdate && (
          <AppDropdownMenuItem onClick={onToggleFreePreview}>
            <EyeOff className="h-4 w-4" />
            {lesson.freePreview ? "إلغاء المعاينة المجانية" : "معاينة مجانية"}
          </AppDropdownMenuItem>
        )}
        {canFeature && (
          <AppDropdownMenuItem onClick={onToggleFeature}>
            <Star className="h-4 w-4" />
            {lesson.featured ? "إلغاء التميز" : "تمييز"}
          </AppDropdownMenuItem>
        )}
        {canCreate && (
          <AppDropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
            نسخ
          </AppDropdownMenuItem>
        )}
        {lesson.deletedAt && canDelete && (
          <AppDropdownMenuItem onClick={onRestore}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        {canDelete && !lesson.deletedAt && (
          <>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </AppDropdownMenuItem>
          </>
        )}
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
});

export { LessonRowActions };
