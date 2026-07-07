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
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { useCan } from "@/hooks";
import type { CourseModule } from "../types";

interface ModuleRowActionsProps {
  module: CourseModule;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onArchive?: () => void;
  onFeature?: () => void;
  onRestore?: () => void;
}

const ModuleRowActions = memo(function ModuleRowActions({
  module,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onUnpublish,
  onArchive,
  onFeature,
  onRestore,
}: ModuleRowActionsProps) {
  const canCreate = useCan("modules.create");
  const canUpdate = useCan("modules.update");
  const canDelete = useCan("modules.delete");
  const canPublish = useCan("modules.publish");
  const canFeature = useCan("modules.feature");

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات الوحدة"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        {onView && (
          <AppDropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4" />
            عرض
          </AppDropdownMenuItem>
        )}
        {canUpdate && onEdit && (
          <AppDropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            تعديل
          </AppDropdownMenuItem>
        )}
        {canCreate && onDuplicate && (
          <AppDropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
            نسخ
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        {canPublish && !module.published && onPublish && (
          <AppDropdownMenuItem onClick={onPublish}>
            <CheckCircle className="h-4 w-4" />
            نشر
          </AppDropdownMenuItem>
        )}
        {canPublish && module.published && onUnpublish && (
          <AppDropdownMenuItem onClick={onUnpublish}>
            <XCircle className="h-4 w-4" />
            إلغاء النشر
          </AppDropdownMenuItem>
        )}
        {onArchive && (
          <AppDropdownMenuItem onClick={onArchive}>
            <XCircle className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        )}
        {canFeature && onFeature && (
          <AppDropdownMenuItem onClick={onFeature}>
            <Star className="h-4 w-4" />
            {module.featured ? "إلغاء التميز" : "تمييز"}
          </AppDropdownMenuItem>
        )}
        {module.deletedAt && canDelete && onRestore && (
          <AppDropdownMenuItem onClick={onRestore}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        {canDelete && !module.deletedAt && onDelete && (
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

export { ModuleRowActions };
