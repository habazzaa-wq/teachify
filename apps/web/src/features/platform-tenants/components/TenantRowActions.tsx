"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Archive,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  ArrowLeftRight,
  RotateCcw,
  Ban,
  Terminal,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { toast } from "sonner";
import type { Tenant } from "../types";

interface TenantRowActionsProps {
  tenant: Tenant;
  onView: () => void;
  onEdit: () => void;
  onOpenDashboard: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onTransferOwnership: () => void;
  onDuplicate: () => void;
  onResetUsage: () => void;
  onDelete: () => void;
}

const TenantRowActions = memo(function TenantRowActions({
  tenant,
  onView,
  onEdit,
  onOpenDashboard,
  onSuspend,
  onActivate,
  onArchive,
  onTransferOwnership,
  onDuplicate,
  onResetUsage,
  onDelete,
}: TenantRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات المؤسسة"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">الإجراءات</div>
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          تعديل
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onOpenDashboard}>
          <ExternalLink className="h-4 w-4" />
          فتح لوحة التحكم
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={() => {
          const domain = tenant.domain.customDomain || `${tenant.domain.platformSubdomain}.${window.location.hostname}`;
          const cmd = `Add-Content -LiteralPath "$env:SystemRoot\\System32\\drivers\\etc\\hosts" -Value "\`n127.0.0.1\t${domain}"`;
          navigator.clipboard.writeText(cmd).catch(() => {});
          toast.success(`تم نسخ الأمر`, { description: `شغّل PowerShell كمسؤول والصق الأمر لإضافة ${domain}` });
        }}>
          <Terminal className="h-4 w-4" />
          إضافة النطاق للمضيف
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
          نسخ
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onTransferOwnership}>
          <ArrowLeftRight className="h-4 w-4" />
          نقل الملكية
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onResetUsage}>
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين الاستخدام
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">الحالة</div>
        {tenant.status !== "suspended" && (
          <AppDropdownMenuItem onClick={onSuspend}>
            <Ban className="h-4 w-4" />
            تعليق
          </AppDropdownMenuItem>
        )}
        {tenant.status !== "active" && tenant.status !== "archived" && (
          <AppDropdownMenuItem onClick={onActivate}>
            <Play className="h-4 w-4" />
            تفعيل
          </AppDropdownMenuItem>
        )}
        {tenant.status === "active" && (
          <AppDropdownMenuItem onClick={onActivate}>
            <Pause className="h-4 w-4" />
            إيقاف
          </AppDropdownMenuItem>
        )}
        {tenant.status !== "archived" && (
          <AppDropdownMenuItem onClick={onArchive}>
            <Archive className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        )}
        {tenant.status === "archived" && (
          <AppDropdownMenuItem onClick={onActivate}>
            <Play className="h-4 w-4" />
            إعادة تفعيل
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

export { TenantRowActions };
