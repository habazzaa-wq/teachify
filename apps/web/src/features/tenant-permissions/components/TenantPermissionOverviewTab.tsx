"use client";

import { Shield, Users, Calendar, Clock, Hash, EyeOff, FileText, Tag, Layers } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSION_STATUS_CONFIG, RISK_LEVEL_CONFIG, MODULE_CONFIG, ACTION_CONFIG } from "../constants";
import type { TenantPermission } from "../types";

interface TenantPermissionOverviewTabProps {
  permission: TenantPermission;
}

function TenantPermissionOverviewTab({ permission }: TenantPermissionOverviewTabProps) {
  const statusConfig = PERMISSION_STATUS_CONFIG[permission.status];
  const riskConfig = RISK_LEVEL_CONFIG[permission.riskLevel];
  const moduleConfig = MODULE_CONFIG[permission.module];
  const actionConfig = ACTION_CONFIG[permission.action];

  const infoRows = [
    { icon: Tag, label: "المفتاح", value: permission.key, dir: "ltr" as const },
    { icon: Layers, label: "الوحدة", value: moduleConfig.label },
    { icon: Hash, label: "الإجراء", value: actionConfig.label },
    { icon: FileText, label: "الوصف", value: permission.description },
    { icon: Calendar, label: "تاريخ الإنشاء", value: formatDate(permission.createdAt) },
    { icon: Clock, label: "آخر تحديث", value: formatDateTime(permission.updatedAt) },
  ];

  const statCards = [
    { icon: Users, label: "الأدوار المستخدمة", value: permission.rolesCount, color: "text-blue-600" },
    { icon: EyeOff, label: "مخفي", value: permission.isHidden ? "نعم" : "لا", color: permission.isHidden ? "text-amber-600" : "text-green-600" },
    { icon: Calendar, label: "تم الإنشاء", value: formatDate(permission.createdAt), color: "text-green-600" },
    { icon: Clock, label: "تم التحديث", value: formatDateTime(permission.updatedAt), color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "default" | "warning" | "outline"}>
          {statusConfig.label}
        </AppBadge>
        <AppBadge variant={riskConfig.color as "success" | "secondary" | "destructive" | "default" | "warning" | "outline"}>
          {riskConfig.label}
        </AppBadge>
        {permission.isSystem && (
          <AppBadge variant="secondary">
            <Shield className="h-3 w-3" />
            صلاحية نظام
          </AppBadge>
        )}
        {permission.isHidden && (
          <AppBadge variant="outline">
            <EyeOff className="h-3 w-3" />
            مخفية
          </AppBadge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-semibold">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">معلومات الصلاحية</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className={`text-sm font-medium truncate ${row.dir === "ltr" ? "text-left" : ""}`} dir={row.dir}>{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {permission.notes && (
        <div className="rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">ملاحظات داخلية</h4>
          <p className="text-sm">{permission.notes}</p>
        </div>
      )}
    </div>
  );
}

export { TenantPermissionOverviewTab };
