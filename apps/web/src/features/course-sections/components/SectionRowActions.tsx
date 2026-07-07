"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Trash2,
  Star,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { useCan } from "@/hooks";
import type { CourseSection } from "../types";

interface SectionRowActionsProps {
  section: CourseSection;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
  onToggleFeature: () => void;
  onToggleLock: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const SectionRowActions = memo(function SectionRowActions({
  section,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDuplicate,
  onToggleFeature,
  onToggleLock,
  onRestore,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionRowActionsProps) {
  const canCreate = useCan("sections.create");
  const canUpdate = useCan("sections.update");
  const canDelete = useCan("sections.delete");
  const canPublish = useCan("sections.publish");
  const canFeature = useCan("sections.feature");
  const canReorder = useCan("sections.reorder");

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات القسم"
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
        {canPublish && !section.published && (
          <AppDropdownMenuItem onClick={onPublish}>
            <CheckCircle className="h-4 w-4" />
            نشر
          </AppDropdownMenuItem>
        )}
        {canPublish && section.published && (
          <AppDropdownMenuItem onClick={onUnpublish}>
            <XCircle className="h-4 w-4" />
            إلغاء النشر
          </AppDropdownMenuItem>
        )}
        {canUpdate && (
          <AppDropdownMenuItem onClick={onToggleLock}>
            {section.locked ? (
              <><Unlock className="h-4 w-4" />فتح</>
            ) : (
              <><Lock className="h-4 w-4" />قفل</>
            )}
          </AppDropdownMenuItem>
        )}
        {canFeature && (
          <AppDropdownMenuItem onClick={onToggleFeature}>
            <Star className="h-4 w-4" />
            {section.featured ? "إلغاء التميز" : "تمييز"}
          </AppDropdownMenuItem>
        )}
        {canCreate && (
          <AppDropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
            نسخ
          </AppDropdownMenuItem>
        )}
        {section.deletedAt && canDelete && (
          <AppDropdownMenuItem onClick={onRestore}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        {canDelete && !section.deletedAt && (
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

export { SectionRowActions };
