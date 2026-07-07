"use client";

import { AppWidget, AppEmptyState, AppAvatar, AppAvatarFallback } from "@/components/ui";
import { Activity, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { initialsOf } from "@/lib/format";
import type { RecentActivityItem } from "@/features/dashboard/types";
import { cn } from "@/lib/cn";

interface RecentActivityProps {
  activities?: RecentActivityItem[];
  isLoading?: boolean;
}

const typeStyles: Record<string, string> = {
  course: "bg-primary/10 text-primary",
  student: "bg-success/10 text-success",
  payment: "bg-warning/10 text-warning",
  system: "bg-muted-foreground/10 text-muted-foreground",
  notification: "bg-info/10 text-info",
};

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  return (
    <AppWidget
      title="آخر النشاطات"
      loading={isLoading}
      loadingHeight={300}
    >
      {!activities || activities.length === 0 ? (
        <AppEmptyState
          icon={Activity}
          title="لا توجد نشاطات"
          description="ستظهر النشاطات هنا عند توفرها"
          variant="compact"
        />
      ) : (
        <div className="space-y-0">
          {activities.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 border-b border-border/30 py-3 last:border-0"
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                typeStyles[item.type] ?? "bg-muted text-muted-foreground",
              )}>
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/60">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(item.timestamp)}</span>
                  <span>·</span>
                  <span>{item.user.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppWidget>
  );
}
