"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface AppEmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact" | "card";
}

function AppEmptyState({
  title = "لا توجد بيانات",
  description = "لم يتم العثور على عناصر لعرضها.",
  icon: Icon = Inbox,
  action,
  secondaryAction,
  className,
  variant = "default",
}: AppEmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact
          ? "gap-2 py-6"
          : "gap-4 rounded-xl border border-dashed p-12",
        variant === "card" && "rounded-xl border bg-card p-12 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          isCompact ? "h-8 w-8" : "h-14 w-14",
        )}
      >
        <Icon className={isCompact ? "h-4 w-4" : "h-7 w-7"} />
      </div>
      <div className={cn("space-y-1", isCompact && "space-y-0")}>
        <p
          className={cn(
            "font-medium text-foreground",
            isCompact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div>{action}</div>}
      {secondaryAction && (
        <div className="text-xs text-muted-foreground/60">{secondaryAction}</div>
      )}
    </div>
  );
}

export { AppEmptyState, type AppEmptyStateProps };
