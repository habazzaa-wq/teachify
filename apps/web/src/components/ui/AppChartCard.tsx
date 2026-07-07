"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";
import { AppEmptyState } from "./AppEmptyState";
import { BarChart3 } from "lucide-react";

interface AppChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  chartHeight?: number;
  className?: string;
  contentClassName?: string;
}

function AppChartCard({
  title,
  description,
  action,
  badge,
  children,
  loading,
  empty,
  emptyMessage,
  error,
  errorMessage,
  chartHeight = 220,
  className,
  contentClassName,
}: AppChartCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border-0 shadow-lg ring-1 ring-border/50 bg-card", className)}>
      <div className="flex flex-row items-center justify-between px-6 pb-2 pt-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("p-6 pt-2", contentClassName)}>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: chartHeight }}
          >
            <div className="w-full space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ) : empty ? (
          <div style={{ height: chartHeight }}>
            <AppEmptyState
              icon={BarChart3}
              title="لا توجد بيانات"
              description={emptyMessage ?? "لا توجد بيانات متاحة للعرض"}
            />
          </div>
        ) : error ? (
          <div
            className="flex items-center justify-center"
            style={{ height: chartHeight }}
          >
            <p className="text-sm text-destructive">
              {errorMessage ?? "حدث خطأ في تحميل البيانات"}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export { AppChartCard, type AppChartCardProps };
