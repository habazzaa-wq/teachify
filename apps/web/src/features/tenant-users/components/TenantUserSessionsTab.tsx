"use client";

import { Globe, LogOut, Smartphone } from "lucide-react";
import { AppBadge, AppButton, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { TenantUserSession } from "../types";

interface TenantUserSessionsTabProps {
  sessions?: TenantUserSession[];
  loading?: boolean;
  onRevoke?: (sessionId: string) => void;
}

function TenantUserSessionsTab({ sessions, loading, onRevoke }: TenantUserSessionsTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Globe className="h-8 w-8 mb-2" />
        <p className="text-sm">لا توجد جلسات نشطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="flex items-start gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{session.location}</p>
              <div className="flex items-center gap-2">
                {session.isCurrent && (
                  <AppBadge variant="success" className="text-[10px]">الحالية</AppBadge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {session.userAgent} · {session.ipAddress}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                آخر نشاط: {formatDateTime(session.lastActive)}
              </span>
              {onRevoke && !session.isCurrent && (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => onRevoke(session.id)}
                >
                  <LogOut className="h-3 w-3" />
                  قطع
                </AppButton>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TenantUserSessionsTab };
