"use client";

import { AppWidget, AppEmptyState, AppBadge } from "@/components/ui";
import { Bell, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { routes } from "@/constants/routes";

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  type?: "info" | "warning" | "success" | "error";
}

interface LatestNotificationsProps {
  notifications?: NotificationItem[];
  isLoading?: boolean;
}

const typeStyles: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

export function LatestNotifications({ notifications, isLoading }: LatestNotificationsProps) {
  return (
    <AppWidget
      title="آخر الإشعارات"
      loading={isLoading}
      loadingHeight={300}
      action={
        <Link
          href={routes.dashboardNotifications}
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          عرض الكل
          <ArrowLeft className="h-3 w-3" />
        </Link>
      }
    >
      {!notifications || notifications.length === 0 ? (
        <AppEmptyState
          icon={Bell}
          title="لا توجد إشعارات"
          description="ستظهر الإشعارات الجديدة هنا"
          variant="compact"
        />
      ) : (
        <div className="space-y-1">
          {notifications.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
                !item.read && "bg-primary/[0.02]",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                typeStyles[item.type ?? "info"],
              )}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm",
                    !item.read ? "font-semibold" : "font-medium text-muted-foreground",
                  )}>
                    {item.title}
                  </p>
                  {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                )}
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {formatDateTime(item.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppWidget>
  );
}

export type { NotificationItem };
