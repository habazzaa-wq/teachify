"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Ban,
  LogOut,
  KeyRound,
  Send,
  Copy,
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
import type { TenantUser } from "../types";

interface TenantUserRowActionsProps {
  user: TenantUser;
  onView: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onForceLogout: () => void;
  onResetPassword: () => void;
  onSendInvite: () => void;
  onResendInvite: () => void;
  onCopyEmail: () => void;
  onDelete: () => void;
}

const TenantUserRowActions = memo(function TenantUserRowActions({
  user,
  onView,
  onEdit,
  onSuspend,
  onActivate,
  onForceLogout,
  onResetPassword,
  onSendInvite,
  onResendInvite,
  onCopyEmail,
  onDelete,
}: TenantUserRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات المستخدم"
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
        {user.status !== "suspended" ? (
          <AppDropdownMenuItem onClick={onSuspend}>
            <Ban className="h-4 w-4" />
            إيقاف
          </AppDropdownMenuItem>
        ) : (
          <AppDropdownMenuItem onClick={onActivate}>
            <UserCheck className="h-4 w-4" />
            تفعيل
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuItem onClick={onForceLogout}>
          <LogOut className="h-4 w-4" />
          قطع الجلسات
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onResetPassword}>
          <KeyRound className="h-4 w-4" />
          إعادة تعيين كلمة المرور
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={onSendInvite}>
          <Send className="h-4 w-4" />
          إرسال دعوة
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onResendInvite}>
          <Send className="h-4 w-4" />
          إعادة إرسال الدعوة
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onCopyEmail}>
          <Copy className="h-4 w-4" />
          نسخ البريد الإلكتروني
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

export { TenantUserRowActions };
