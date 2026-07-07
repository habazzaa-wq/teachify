"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

interface AppWidgetProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  loading?: boolean;
  loadingHeight?: number;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "elevated" | "glass";
}

const variantClasses = {
  default: "border bg-card text-card-foreground shadow-sm",
  elevated: "border-0 shadow-lg ring-1 ring-border/50 bg-card text-card-foreground",
  glass: "bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm",
};

function AppWidget({
  children,
  title,
  description,
  action,
  loading,
  loadingHeight,
  error,
  errorMessage,
  onRetry,
  className,
  contentClassName,
  variant = "elevated",
}: AppWidgetProps) {
  if (loading) {
    return (
      <div
        className={cn("rounded-xl overflow-hidden", variantClasses[variant], className)}
      >
        <div className="p-5">
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              {action && <Skeleton className="h-8 w-20" />}
            </div>
          )}
          <div className="space-y-3" style={loadingHeight ? { height: loadingHeight } : undefined}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-xl overflow-hidden",
          variantClasses[variant],
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-medium text-destructive">حدث خطأ</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {errorMessage ?? "تعذّر تحميل المحتوى"}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", variantClasses[variant], className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </div>
  );
}

export { AppWidget, type AppWidgetProps };
