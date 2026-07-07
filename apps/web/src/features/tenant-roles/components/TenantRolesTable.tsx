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
  AppCheckbox,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import * as Icons from "lucide-react";
import { ROLE_STATUS_CONFIG, ROLE_SLUG_CONFIG } from "../constants";
import { TenantRoleRowActions } from "./TenantRoleRowActions";
import type { TenantRole } from "../types";

interface TenantRolesTableProps {
  roles: TenantRole[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (role: TenantRole) => void;
  onEdit: (role: TenantRole) => void;
  onDuplicate: (role: TenantRole) => void;
  onArchive: (role: TenantRole) => void;
  onRestore: (role: TenantRole) => void;
  onActivate: (role: TenantRole) => void;
  onDeactivate: (role: TenantRole) => void;
  onAssignUsers: (role: TenantRole) => void;
  onExport: (role: TenantRole) => void;
  onDelete: (role: TenantRole) => void;
}

function getIconComponent(iconName: string) {
  const icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return icon ?? Icons.Shield;
}

const TenantRolesTableRow = memo(function TenantRolesTableRow({
  role,
  selectedIds,
  onSelectionChange,
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
}: {
  role: TenantRole;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (role: TenantRole) => void;
  onEdit: (role: TenantRole) => void;
  onDuplicate: (role: TenantRole) => void;
  onArchive: (role: TenantRole) => void;
  onRestore: (role: TenantRole) => void;
  onActivate: (role: TenantRole) => void;
  onDeactivate: (role: TenantRole) => void;
  onAssignUsers: (role: TenantRole) => void;
  onExport: (role: TenantRole) => void;
  onDelete: (role: TenantRole) => void;
}) {
  const statusConfig = ROLE_STATUS_CONFIG[role.status];
  const slugConfig = ROLE_SLUG_CONFIG[role.slug];
  const isChecked = selectedIds?.includes(role.id) ?? false;
  const IconComponent = getIconComponent(role.icon);

  const handleCheck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== role.id)
      : [...(selectedIds ?? []), role.id];
    onSelectionChange(next);
  }, [role.id, isChecked, selectedIds, onSelectionChange]);

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(role)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck as never} />
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${role.color}1a`, color: role.color }}
          >
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{role.nameAr}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{role.name}</p>
          </div>
        </div>
      </AppTableCell>
      <AppTableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
        {role.description}
      </AppTableCell>
      <AppTableCell>
        {role.isSystem && (
          <AppBadge variant="secondary" className="text-[10px]">نظام</AppBadge>
        )}
      </AppTableCell>
      <AppTableCell>
        <span className="text-sm tabular-nums">{role.usersCount}</span>
      </AppTableCell>
      <AppTableCell>
        <span className="text-sm tabular-nums">{role.permissionsCount}</span>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={statusConfig.color as "success" | "secondary" | "destructive" | "default" | "warning" | "outline"}
          className="text-[10px] gap-1"
        >
          <span
            className={statusConfig.color === "success" ? "bg-success" : statusConfig.color === "secondary" ? "bg-muted-foreground" : "bg-warning"}
            style={{ height: 6, width: 6, borderRadius: "50%", display: "inline-block" }}
          />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground">
        {role.createdBy}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(role.createdAt)}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDateTime(role.updatedAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <TenantRoleRowActions
          role={role}
          onView={() => onView(role)}
          onEdit={() => onEdit(role)}
          onDuplicate={() => onDuplicate(role)}
          onArchive={() => onArchive(role)}
          onRestore={() => onRestore(role)}
          onActivate={() => onActivate(role)}
          onDeactivate={() => onDeactivate(role)}
          onAssignUsers={() => onAssignUsers(role)}
          onExport={() => onExport(role)}
          onDelete={() => onDelete(role)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function TenantRolesTable(props: TenantRolesTableProps) {
  const { roles, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = roles.length > 0 && selectedIds?.length === roles.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(roles.map((r) => r.id));
    }
  }, [roles, allSelected, onSelectionChange]);

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
            <AppTableHead>الدور</AppTableHead>
            <AppTableHead>الوصف</AppTableHead>
            <AppTableHead>نظام</AppTableHead>
            <AppTableHead>المستخدمون</AppTableHead>
            <AppTableHead>الصلاحيات</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>أنشئ بواسطة</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead>آخر تحديث</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {roles.map((role) => (
            <TenantRolesTableRow key={role.id} role={role} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { TenantRolesTable };
