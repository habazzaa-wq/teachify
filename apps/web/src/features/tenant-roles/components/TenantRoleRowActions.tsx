"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Archive,
  RotateCcw,
  UserCheck,
  UserX,
  Download,
  Users,
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
import type { TenantRole } from "../types";

interface TenantRoleRowActionsProps {
  role: TenantRole;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onAssignUsers: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const TenantRoleRowActions = memo(function TenantRoleRowActions({
  role,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onActivate,
  onDeactivate,
  onAssignUsers,
  onExport,
  onDelete,
}: TenantRoleRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات الدور"
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
        <AppDropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
          نسخ
        </AppDropdownMenuItem>
        {role.status !== "archived" ? (
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
        {role.status === "active" ? (
          <AppDropdownMenuItem onClick={onDeactivate}>
            <UserX className="h-4 w-4" />
            تعطيل
          </AppDropdownMenuItem>
        ) : (
          <AppDropdownMenuItem onClick={onActivate}>
            <UserCheck className="h-4 w-4" />
            تفعيل
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={onAssignUsers}>
          <Users className="h-4 w-4" />
          تعيين مستخدمين
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onExport}>
          <Download className="h-4 w-4" />
          تصدير
        </AppDropdownMenuItem>
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

export { TenantRoleRowActions };
