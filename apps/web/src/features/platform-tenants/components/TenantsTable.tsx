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
  AppProgress,
  AppAvatar,
  AppAvatarFallback,
  AppCheckbox,
} from "@/components/ui";
import { formatDate, formatNumber, initialsOf } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Copy, Check, ExternalLink } from "lucide-react";
import { env } from "@/config/env";
import { TENANT_STATUS_CONFIG } from "../constants";
import { TenantRowActions } from "./TenantRowActions";
import type { Tenant } from "../types";

interface TenantsTableProps {
  tenants: Tenant[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onOpenDashboard: (tenant: Tenant) => void;
  onSuspend: (tenant: Tenant) => void;
  onActivate: (tenant: Tenant) => void;
  onArchive: (tenant: Tenant) => void;
  onTransferOwnership: (tenant: Tenant) => void;
  onDuplicate: (tenant: Tenant) => void;
  onResetUsage: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

function getProgressVariant(used: number, max: number) {
  const pct = max > 0 ? (used / max) * 100 : 0;
  if (pct >= 90) return "destructive";
  if (pct >= 75) return "warning";
  return "success";
}

function formatUsage(used: number, max: number, unit: string) {
  if (max >= 99999) return `${formatNumber(used)} ${unit}`;
  return `${formatNumber(used)} / ${formatNumber(max)} ${unit}`;
}

const TenantsTableRow = memo(function TenantsTableRow({
  tenant,
  selectedIds,
  onSelectionChange,
  ...actions
}: {
  tenant: Tenant;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onOpenDashboard: (tenant: Tenant) => void;
  onSuspend: (tenant: Tenant) => void;
  onActivate: (tenant: Tenant) => void;
  onArchive: (tenant: Tenant) => void;
  onTransferOwnership: (tenant: Tenant) => void;
  onDuplicate: (tenant: Tenant) => void;
  onResetUsage: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}) {
  const [domainCopied, setDomainCopied] = useState(false);
  const statusConfig = TENANT_STATUS_CONFIG[tenant.status];
  const isChecked = selectedIds?.includes(tenant.id) ?? false;

  const handleCheck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== tenant.id)
      : [...(selectedIds ?? []), tenant.id];
    onSelectionChange(next);
  }, [tenant.id, isChecked, selectedIds, onSelectionChange]);
  const storageVariant = getProgressVariant(tenant.limits.storageUsed, tenant.limits.storage);
  const bandwidthVariant = getProgressVariant(tenant.limits.bandwidthUsed, tenant.limits.bandwidth);
  const videosVariant = getProgressVariant(tenant.limits.videosUsed, tenant.limits.videos);

  const tenantDomain = tenant.domain.customDomain ?? `${tenant.domain.platformSubdomain}.${env.appBaseDomain}`;
  const tenantUrl = `https://${tenantDomain}`;

  const copyDomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tenantDomain);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2000);
  };

  const openDomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(tenantUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => actions.onEdit(tenant)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck as never} />
      </AppTableCell>
      <AppTableCell>
        <AppAvatar className="h-8 w-8 rounded-lg">
          <AppAvatarFallback className="text-xs font-semibold" style={{ backgroundColor: tenant.branding.primaryColor + "20", color: tenant.branding.primaryColor }}>
            {initialsOf(tenant.name)}
          </AppAvatarFallback>
        </AppAvatar>
      </AppTableCell>
      <AppTableCell>
        <div className="min-w-0">
          <p className="truncate font-medium">{tenant.name}</p>
          <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
        </div>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-1.5 max-w-[160px]">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            tenant.domain.sslStatus === "active" && "bg-success",
            tenant.domain.sslStatus === "pending" && "bg-warning",
            tenant.domain.sslStatus === "expired" && "bg-destructive",
            tenant.domain.sslStatus === "error" && "bg-destructive",
          )} />
          <span className="text-xs text-muted-foreground truncate">{tenantDomain}</span>
          <button
            onClick={copyDomain}
            className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            title="نسخ النطاق"
          >
            {domainCopied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            onClick={openDomain}
            className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            title="فتح في تبويب جديد"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </AppTableCell>
      <AppTableCell>
        <span className="text-xs">{tenant.owner.name}</span>
      </AppTableCell>
      <AppTableCell>
        <span className="text-xs font-medium">{tenant.subscription.planName}</span>
      </AppTableCell>
      <AppTableCell>
        <AppBadge variant={statusConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"} className="gap-1">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            tenant.status === "active" && "bg-success",
            tenant.status === "trial" && "bg-cyan-500",
            tenant.status === "suspended" && "bg-destructive",
            tenant.status === "pending" && "bg-warning",
            tenant.status === "archived" && "bg-muted-foreground/50",
            tenant.status === "cancelled" && "bg-muted-foreground",
            tenant.status === "expired" && "bg-destructive/70",
          )} />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell className="min-w-[120px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="tabular-nums">{formatUsage(tenant.limits.storageUsed, tenant.limits.storage, "GB")}</span>
          </div>
          {tenant.limits.storage < 99999 && (
            <AppProgress value={tenant.limits.storageUsed} max={tenant.limits.storage} size="sm" variant={storageVariant} />
          )}
        </div>
      </AppTableCell>
      <AppTableCell className="min-w-[120px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="tabular-nums">{formatUsage(tenant.limits.bandwidthUsed, tenant.limits.bandwidth, "GB")}</span>
          </div>
          {tenant.limits.bandwidth < 99999 && (
            <AppProgress value={tenant.limits.bandwidthUsed} max={tenant.limits.bandwidth} size="sm" variant={bandwidthVariant} />
          )}
        </div>
      </AppTableCell>
      <AppTableCell className="min-w-[100px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="tabular-nums">{formatUsage(tenant.limits.videosUsed, tenant.limits.videos, "")}</span>
          </div>
          {tenant.limits.videos < 99999 && (
            <AppProgress value={tenant.limits.videosUsed} max={tenant.limits.videos} size="sm" variant={videosVariant} />
          )}
        </div>
      </AppTableCell>
      <AppTableCell className="tabular-nums text-xs">{formatNumber(tenant.limits.usersUsed)}</AppTableCell>
      <AppTableCell className="tabular-nums text-xs">{formatNumber(tenant.limits.coursesUsed)}</AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(tenant.createdAt)}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(tenant.lastActivity)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <TenantRowActions
          tenant={tenant}
          onView={() => actions.onView(tenant)}
          onEdit={() => actions.onEdit(tenant)}
          onOpenDashboard={() => actions.onOpenDashboard(tenant)}
          onSuspend={() => actions.onSuspend(tenant)}
          onActivate={() => actions.onActivate(tenant)}
          onArchive={() => actions.onArchive(tenant)}
          onTransferOwnership={() => actions.onTransferOwnership(tenant)}
          onDuplicate={() => actions.onDuplicate(tenant)}
          onResetUsage={() => actions.onResetUsage(tenant)}
          onDelete={() => actions.onDelete(tenant)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function TenantsTable(props: TenantsTableProps) {
  const { tenants, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = tenants.length > 0 && selectedIds?.length === tenants.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tenants.map((t) => t.id));
    }
  }, [tenants, allSelected, onSelectionChange]);

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
            <AppTableHead>اسم المؤسسة</AppTableHead>
            <AppTableHead>النطاق</AppTableHead>
            <AppTableHead>المالك</AppTableHead>
            <AppTableHead>الباقة</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>مساحة التخزين</AppTableHead>
            <AppTableHead>النطاق الترددي</AppTableHead>
            <AppTableHead>الفيديوهات</AppTableHead>
            <AppTableHead>المستخدمين</AppTableHead>
            <AppTableHead>الدورات</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead>آخر نشاط</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {tenants.map((tenant) => (
            <TenantsTableRow key={tenant.id} tenant={tenant} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { TenantsTable };
