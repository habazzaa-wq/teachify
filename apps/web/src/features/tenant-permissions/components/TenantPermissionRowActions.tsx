"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import type { TenantPermission } from "../types";

interface TenantPermissionRowActionsProps {
  permission: TenantPermission;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

const TenantPermissionRowActions = memo(function TenantPermissionRowActions({
  permission,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: TenantPermissionRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات الصلاحية"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          تعديل
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        {permission.status !== "archived" ? (
          <AppDropdownMenuItem onClick={onArchive}>
            <Archive className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        ) : (
          <AppDropdownMenuItem onClick={onRestore}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </AppDropdownMenuItem>
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
});

export { TenantPermissionRowActions };
