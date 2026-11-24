"use client";

import { Clock, Plus, Pencil, UserPlus, UserMinus, Download, Archive, RotateCcw, UserCheck, UserX, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { TenantRoleActivity } from "../types";

interface TenantRoleActivityTabProps {
  activities?: TenantRoleActivity[];
  loading?: boolean;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  created: Plus,
  edited: Pencil,
  assigned: UserPlus,
  unassigned: UserMinus,
  imported: Download,
  archived: Archive,
  restored: RotateCcw,
  activated: UserCheck,
  deactivated: UserX,
  duplicated: Copy,
};

const ACTION_LABELS: Record<string, string> = {
  created: "إنشاء",
  edited: "تعديل",
  assigned: "تعيين",
  unassigned: "إلغاء تعيين",
  imported: "استيراد",
  archived: "أرشفة",
  restored: "استعادة",
  activated: "تفعيل",
  deactivated: "تعطيل",
  duplicated: "نسخ",
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-studio-success bg-studio-success/15",
  edited: "text-studio-info bg-studio-info/10",
  assigned: "text-secondary bg-secondary/10",
  unassigned: "text-studio-warning bg-studio-warning/10",
  imported: "text-studio-info bg-studio-info/10",
  archived: "text-studio-warning bg-studio-warning/10",
  restored: "text-studio-success bg-studio-success/15",
  activated: "text-studio-success bg-studio-success/15",
  deactivated: "text-studio-danger bg-studio-danger/10",
  duplicated: "text-studio-accent bg-studio-accent/10",
};

function TenantRoleActivityTab({ activities, loading }: TenantRoleActivityTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">لا توجد نشاطات مسجلة لهذا الدور</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || Clock;
        const colorClass = ACTION_COLORS[activity.action] || "text-muted-foreground bg-muted";
        return (
          <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{activity.performedBy}</span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TenantRoleActivityTab };
