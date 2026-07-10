"use client";

import { Shield, Users, Key, Calendar, Clock, Hash, CheckCircle, XCircle, FileText } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROLE_STATUS_CONFIG } from "../constants";
import type { TenantRole } from "../types";

interface TenantRoleOverviewTabProps {
  role: TenantRole;
}

function TenantRoleOverviewTab({ role }: TenantRoleOverviewTabProps) {
  const statusConfig = ROLE_STATUS_CONFIG[role.status];

  const infoRows = [
    { icon: Hash, label: "الاسم باللاتينية", value: role.name },
    { icon: FileText, label: "الوصف", value: role.description },
    { icon: Calendar, label: "تاريخ الإنشاء", value: formatDate(role.createdAt) },
    { icon: Clock, label: "آخر تحديث", value: formatDateTime(role.updatedAt) },
  ];

  const statCards = [
    { icon: Users, label: "المستخدمون", value: role.usersCount, color: "text-blue-600" },
    { icon: Key, label: "الصلاحيات", value: role.permissionsCount, color: "text-secondary" },
    { icon: Calendar, label: "تم الإنشاء", value: formatDate(role.createdAt), color: "text-green-600" },
    { icon: Clock, label: "تم التحديث", value: formatDateTime(role.updatedAt), color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "default" | "warning" | "outline"}>
          {statusConfig.label}
        </AppBadge>
        {role.isSystem && (
          <AppBadge variant="secondary">
            <Shield className="h-3 w-3" />
            دور نظام
          </AppBadge>
        )}
        {role.isDefault ? (
          <AppBadge variant="success">
            <CheckCircle className="h-3 w-3" />
            دور افتراضي
          </AppBadge>
        ) : (
          <AppBadge variant="outline">
            <XCircle className="h-3 w-3" />
            غير افتراضي
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
        <h4 className="text-sm font-semibold text-foreground">معلومات الدور</h4>
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
                  <p className="text-sm font-medium truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {role.notes && (
        <div className="rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">ملاحظات</h4>
          <p className="text-sm">{role.notes}</p>
        </div>
      )}
    </div>
  );
}

export { TenantRoleOverviewTab };
