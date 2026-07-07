"use client";

import { AppWidget, AppProgress } from "@/components/ui";
import { USAGE_METRICS } from "@/features/dashboard/constants";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export function UsageWidgets() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  return (
    <AppWidget
      title="استخدام الموارد"
      loading={isLoading}
      loadingHeight={200}
      error={isError}
      onRetry={() => refetch()}
    >
      <div className="space-y-5">
        {USAGE_METRICS.map((metric) => {
          const used = stats ? (stats as any)[metric.key] ?? 0 : 0;
          const total = stats ? (stats as any)[metric.totalKey] ?? 1 : 1;
          const percentage = Math.min((used / total) * 100, 100);

          return (
            <div key={metric.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    metric.color === "primary" && "bg-primary/10 text-primary",
                    metric.color === "info" && "bg-cyan-500/10 text-cyan-500",
                    metric.color === "warning" && "bg-warning/10 text-warning",
                  )}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatNumber(used)} / {formatNumber(total)} {metric.unit}
                </span>
              </div>
              <AppProgress
                value={percentage}
                variant={percentage > 90 ? "destructive" : percentage > 75 ? "warning" : "default"}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </AppWidget>
  );
}
