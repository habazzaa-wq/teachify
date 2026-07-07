"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Trash2,
  Star,
  Archive,
  RotateCcw,
  CheckCircle,
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
import type { Category } from "../types";

interface CategoryRowActionsProps {
  category: Category;
  onView: () => void;
  onEdit: () => void;
  onToggleFeature: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onForceDelete: () => void;
}

const CategoryRowActions = memo(function CategoryRowActions({
  category,
  onView,
  onEdit,
  onToggleFeature,
  onToggleActive,
  onDuplicate,
  onDelete,
  onRestore,
  onForceDelete,
}: CategoryRowActionsProps) {
  const canUpdate = useCan("categories.update");
  const canFeature = useCan("categories.feature");
  const canActivate = useCan("categories.activate");
  const canCreate = useCan("categories.create");
  const canDelete = useCan("categories.delete");
  const canRestore = useCan("categories.restore");

  const isDeleted = !!category.deletedAt;

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات التصنيف"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض
        </AppDropdownMenuItem>
        {canUpdate && !isDeleted && (
          <AppDropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            تعديل
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        {!isDeleted && (
          <>
            {canActivate && (
              <AppDropdownMenuItem onClick={onToggleActive}>
                <CheckCircle className="h-4 w-4" />
                {category.active ? "تعطيل" : "تفعيل"}
              </AppDropdownMenuItem>
            )}
            {canFeature && (
              <AppDropdownMenuItem onClick={onToggleFeature}>
                <Star className="h-4 w-4" />
                {category.featured ? "إلغاء التميز" : "تمييز"}
              </AppDropdownMenuItem>
            )}
            {canCreate && (
              <AppDropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
                نسخ
              </AppDropdownMenuItem>
            )}
            {canDelete && (
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
          </>
        )}
        {isDeleted && canRestore && (
          <>
            <AppDropdownMenuItem onClick={onRestore}>
              <RotateCcw className="h-4 w-4" />
              استعادة
            </AppDropdownMenuItem>
            {canDelete && (
              <>
                <AppDropdownMenuSeparator />
                <AppDropdownMenuItem
                  onClick={onForceDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف نهائي
                </AppDropdownMenuItem>
              </>
            )}
          </>
        )}
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
});

export { CategoryRowActions };