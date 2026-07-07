"use client";

import { Users } from "lucide-react";
import { AppAvatar, AppAvatarFallback, AppBadge, AppEmptyState, Skeleton } from "@/components/ui";
import { initialsOf } from "@/lib/format";
import type { TenantRoleUser } from "../types";

interface TenantRoleUsersTabProps {
  users?: TenantRoleUser[];
  loading?: boolean;
}

function TenantRoleUsersTab({ users, loading }: TenantRoleUsersTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <AppEmptyState
        icon={Users}
        title="لا يوجد مستخدمون"
        description="لم يتم تعيين أي مستخدمين في هذا الدور بعد."
      />
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3 rounded-lg border p-3">
          <AppAvatar className="h-10 w-10">
            <AppAvatarFallback className="text-xs">{initialsOf(user.fullName)}</AppAvatarFallback>
          </AppAvatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">{user.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{user.department}</p>
            <AppBadge
              variant={user.status === "active" ? "success" : "secondary"}
              className="text-[10px]"
            >
              {user.status === "active" ? "نشط" : "غير نشط"}
            </AppBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TenantRoleUsersTab };
