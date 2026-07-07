"use client";

import { Users } from "lucide-react";
import { AppBadge, AppEmptyState, Skeleton } from "@/components/ui";
import type { TenantPermissionRole } from "../types";

interface TenantPermissionRolesTabProps {
  roles?: TenantPermissionRole[];
  loading?: boolean;
}

function TenantPermissionRolesTab({ roles, loading }: TenantPermissionRolesTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <AppEmptyState
        icon={Users}
        title="لا توجد أدوار"
        description="لم يتم تعيين هذه الصلاحية لأي دور بعد."
      />
    );
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center gap-3 rounded-lg border p-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${role.color}1a`, color: role.color }}
          >
            <span className="text-sm font-bold">{role.nameAr.slice(0, 2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{role.nameAr}</p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">{role.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{role.usersCount} مستخدم</p>
            <AppBadge variant="secondary" className="text-[10px]">
              {role.slug}
            </AppBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TenantPermissionRolesTab };
