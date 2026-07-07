"use client";

import { Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { Activity, LogIn, UserCog, Shield, KeyRound, Smartphone } from "lucide-react";
import type { TenantUserActivity } from "../types";

const actionIcons: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogIn,
  update_profile: UserCog,
  update_role: UserCog,
  password_change: KeyRound,
  two_factor_enabled: Shield,
  two_factor_disabled: Shield,
  device_trusted: Smartphone,
};

interface TenantUserActivityTabProps {
  activities?: TenantUserActivity[];
  loading?: boolean;
}

function TenantUserActivityTab({ activities, loading }: TenantUserActivityTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-sm">لا توجد نشاطات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((act) => {
        const Icon = actionIcons[act.action] ?? Activity;
        return (
          <div key={act.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{act.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDateTime(act.timestamp)}</span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground">{act.ipAddress}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TenantUserActivityTab };
