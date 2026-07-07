"use client";

import { memo, useState, useCallback } from "react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppAvatar,
  AppAvatarFallback,
  AppCheckbox,
} from "@/components/ui";
import { formatDate, formatDateTime, initialsOf } from "@/lib/format";
import { Copy, Check, Smartphone, ShieldCheck, ShieldX } from "lucide-react";
import { USER_STATUS_CONFIG, USER_ROLE_CONFIG, DEPARTMENT_CONFIG } from "../constants";
import { TenantUserRowActions } from "./TenantUserRowActions";
import type { TenantUser } from "../types";

interface TenantUsersTableProps {
  users: TenantUser[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (user: TenantUser) => void;
  onEdit: (user: TenantUser) => void;
  onSuspend: (user: TenantUser) => void;
  onActivate: (user: TenantUser) => void;
  onForceLogout: (user: TenantUser) => void;
  onResetPassword: (user: TenantUser) => void;
  onSendInvite: (user: TenantUser) => void;
  onResendInvite: (user: TenantUser) => void;
  onCopyEmail: (user: TenantUser) => void;
  onDelete: (user: TenantUser) => void;
}

const TenantUsersTableRow = memo(function TenantUsersTableRow({
  user,
  selectedIds,
  onSelectionChange,
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
}: {
  user: TenantUser;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (user: TenantUser) => void;
  onEdit: (user: TenantUser) => void;
  onSuspend: (user: TenantUser) => void;
  onActivate: (user: TenantUser) => void;
  onForceLogout: (user: TenantUser) => void;
  onResetPassword: (user: TenantUser) => void;
  onSendInvite: (user: TenantUser) => void;
  onResendInvite: (user: TenantUser) => void;
  onCopyEmail: (user: TenantUser) => void;
  onDelete: (user: TenantUser) => void;
}) {
  const [emailCopied, setEmailCopied] = useState(false);
  const statusConfig = USER_STATUS_CONFIG[user.status];
  const roleConfig = USER_ROLE_CONFIG[user.role.slug];
  const deptConfig = DEPARTMENT_CONFIG[user.department];
  const isChecked = selectedIds?.includes(user.id) ?? false;

  const handleCheck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== user.id)
      : [...(selectedIds ?? []), user.id];
    onSelectionChange(next);
  }, [user.id, isChecked, selectedIds, onSelectionChange]);

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(user.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(user)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck as never} />
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-3 min-w-0">
          <AppAvatar className="h-8 w-8">
            <AppAvatarFallback className="text-xs">{initialsOf(user.fullName)}</AppAvatarFallback>
          </AppAvatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.fullName}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{deptConfig.label}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{user.jobTitle}</span>
            </div>
          </div>
        </div>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" dir="ltr">{user.email}</span>
          <button
            onClick={copyEmail}
            className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            title="نسخ البريد"
          >
            {emailCopied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground" dir="ltr">
        {user.phone || "—"}
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={roleConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
          className="text-[10px]"
        >
          {roleConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={statusConfig.color as "success" | "secondary" | "destructive"}
          className="text-[10px] gap-1"
        >
          <span className={statusConfig.color === "success" ? "bg-success" : statusConfig.color === "secondary" ? "bg-muted-foreground" : "bg-destructive"} style={{ height: 6, width: 6, borderRadius: "50%", display: "inline-block" }} />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        {user.twoFactorEnabled ? (
          <ShieldCheck className="h-4 w-4 text-success" />
        ) : (
          <ShieldX className="h-4 w-4 text-muted-foreground/50" />
        )}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {user.lastLogin ? formatDateTime(user.lastLogin) : "—"}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(user.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <TenantUserRowActions
          user={user}
          onView={() => onView(user)}
          onEdit={() => onEdit(user)}
          onSuspend={() => onSuspend(user)}
          onActivate={() => onActivate(user)}
          onForceLogout={() => onForceLogout(user)}
          onResetPassword={() => onResetPassword(user)}
          onSendInvite={() => onSendInvite(user)}
          onResendInvite={() => onResendInvite(user)}
          onCopyEmail={() => onCopyEmail(user)}
          onDelete={() => onDelete(user)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function TenantUsersTable(props: TenantUsersTableProps) {
  const { users, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = users.length > 0 && selectedIds?.length === users.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(users.map((u) => u.id));
    }
  }, [users, allSelected, onSelectionChange]);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <AppTable>
        <AppTableHeader>
          <AppTableRow>
            <AppTableHead className="w-10">
              <AppCheckbox
                checked={allSelected}
                onCheckedChange={toggleAll as never}
              />
            </AppTableHead>
            <AppTableHead>المستخدم</AppTableHead>
            <AppTableHead>البريد الإلكتروني</AppTableHead>
            <AppTableHead>الهاتف</AppTableHead>
            <AppTableHead>الدور</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>2FA</AppTableHead>
            <AppTableHead>آخر دخول</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {users.map((user) => (
            <TenantUsersTableRow key={user.id} user={user} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { TenantUsersTable };
