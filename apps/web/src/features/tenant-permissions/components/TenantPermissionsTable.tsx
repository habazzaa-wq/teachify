"use client";

import { memo, useCallback } from "react";
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
import { PERMISSION_STATUS_CONFIG, RISK_LEVEL_CONFIG, MODULE_CONFIG, ACTION_CONFIG } from "../constants";
import { TenantPermissionRowActions } from "./TenantPermissionRowActions";
import type { TenantPermission } from "../types";

interface TenantPermissionsTableProps {
  permissions: TenantPermission[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (permission: TenantPermission) => void;
  onEdit: (permission: TenantPermission) => void;
  onArchive: (permission: TenantPermission) => void;
  onRestore: (permission: TenantPermission) => void;
  onDelete: (permission: TenantPermission) => void;
}

const TenantPermissionsTableRow = memo(function TenantPermissionsTableRow({
  permission,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  permission: TenantPermission;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (permission: TenantPermission) => void;
  onEdit: (permission: TenantPermission) => void;
  onArchive: (permission: TenantPermission) => void;
  onRestore: (permission: TenantPermission) => void;
  onDelete: (permission: TenantPermission) => void;
}) {
  const statusConfig = PERMISSION_STATUS_CONFIG[permission.status];
  const riskConfig = RISK_LEVEL_CONFIG[permission.riskLevel];
  const moduleConfig = MODULE_CONFIG[permission.module];
  const actionConfig = ACTION_CONFIG[permission.action];
  const isChecked = selectedIds?.includes(permission.id) ?? false;

  const handleCheck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== permission.id)
      : [...(selectedIds ?? []), permission.id];
    onSelectionChange(next);
  }, [permission.id, isChecked, selectedIds, onSelectionChange]);

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(permission)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck as never} />
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-sm font-mono font-medium text-foreground truncate" dir="ltr">
            {permission.key}
          </code>
        </div>
      </AppTableCell>
      <AppTableCell className="text-sm font-medium truncate max-w-[150px]">
        {permission.nameAr}
      </AppTableCell>
      <AppTableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
        {permission.nameEn}
      </AppTableCell>
      <AppTableCell>
        <AppBadge variant="secondary" className="text-[10px]">
          {moduleConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground">
        {actionConfig.label}
      </AppTableCell>
      <AppTableCell className="text-xs truncate max-w-[150px] text-muted-foreground">
        {permission.description}
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={riskConfig.color as "success" | "secondary" | "destructive" | "default" | "warning" | "outline"}
          className="text-[10px]"
        >
          {riskConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        {permission.isSystem && (
          <AppBadge variant="secondary" className="text-[10px]">نظام</AppBadge>
        )}
      </AppTableCell>
      <AppTableCell className="text-sm tabular-nums">
        {permission.rolesCount}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(permission.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <TenantPermissionRowActions
          permission={permission}
          onView={() => onView(permission)}
          onEdit={() => onEdit(permission)}
          onArchive={() => onArchive(permission)}
          onRestore={() => onRestore(permission)}
          onDelete={() => onDelete(permission)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function TenantPermissionsTable(props: TenantPermissionsTableProps) {
  const { permissions, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = permissions.length > 0 && selectedIds?.length === permissions.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(permissions.map((p) => p.id));
    }
  }, [permissions, allSelected, onSelectionChange]);

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
            <AppTableHead>المفتاح</AppTableHead>
            <AppTableHead>الاسم بالعربية</AppTableHead>
            <AppTableHead>الاسم بالإنجليزية</AppTableHead>
            <AppTableHead>الوحدة</AppTableHead>
            <AppTableHead>الإجراء</AppTableHead>
            <AppTableHead>الوصف</AppTableHead>
            <AppTableHead>المخاطرة</AppTableHead>
            <AppTableHead>نظام</AppTableHead>
            <AppTableHead>الأدوار</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {permissions.map((permission) => (
            <TenantPermissionsTableRow key={permission.id} permission={permission} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { TenantPermissionsTable };
