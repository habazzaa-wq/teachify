"use client";

import { AppMetricCard, AppWidget } from "@/components/ui";
import { DASHBOARD_METRICS } from "@/features/dashboard/constants";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useCan } from "@/hooks";

export function DashboardMetrics() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  return (
    <AppWidget
      title="مؤشرات الأداء"
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      variant="default"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_METRICS.map((metric) => {
          const allowed = useCan(metric.permission ?? null);
          if (!allowed) return null;

          const value = stats ? (stats as any)[metric.key] ?? 0 : 0;
          const trendKey = metric.key.replace("_count", "_trend").replace("_revenue", "_trend").replace("_users", "_users_trend");
          const trend = stats ? (stats as any)[trendKey] : undefined;

          return (
            <AppMetricCard
              key={metric.key}
              title={metric.label}
              value={typeof value === "number" ? value : 0}
              icon={metric.icon}
              color={metric.color}
              loading={isLoading}
              trend={trend ? { value: Math.abs(trend), positive: trend >= 0 } : undefined}
              prefix={metric.format === "currency" ? "ر.س " : undefined}
            />
          );
        })}
      </div>
    </AppWidget>
  );
}
