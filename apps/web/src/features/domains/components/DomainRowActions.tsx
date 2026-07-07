"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  ShieldCheck,
  RefreshCw,
  Shield,
  Copy,
  ExternalLink,
  Star,
  Trash2,
  MoreHorizontal,
  ScrollText,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import type { PlatformDomain } from "../types";

interface DomainRowActionsProps {
  domain: PlatformDomain;
  onView: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onRefreshStatus: () => void;
  onRenewSsl: () => void;
  onCopy: () => void;
  onOpen: () => void;
  onMakePrimary: () => void;
  onDelete: () => void;
}

const DomainRowActions = memo(function DomainRowActions({
  domain,
  onView,
  onEdit,
  onVerify,
  onRefreshStatus,
  onRenewSsl,
  onCopy,
  onOpen,
  onMakePrimary,
  onDelete,
}: DomainRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات النطاق"
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
        {domain.verificationStatus !== "active" && (
          <AppDropdownMenuItem onClick={onVerify}>
            <ShieldCheck className="h-4 w-4" />
            التحقق من DNS
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuItem onClick={onRefreshStatus}>
          <RefreshCw className="h-4 w-4" />
          تحديث الحالة
        </AppDropdownMenuItem>
        {domain.ssl.status !== "active" && (
          <AppDropdownMenuItem onClick={onRenewSsl}>
            <Shield className="h-4 w-4" />
            تجديد SSL
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={onCopy}>
          <Copy className="h-4 w-4" />
          نسخ النطاق
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onOpen}>
          <ExternalLink className="h-4 w-4" />
          فتح النطاق
        </AppDropdownMenuItem>
        {!domain.isPrimary && (
          <AppDropdownMenuItem onClick={onMakePrimary}>
            <Star className="h-4 w-4" />
            تعيين كأساسي
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

export { DomainRowActions };
