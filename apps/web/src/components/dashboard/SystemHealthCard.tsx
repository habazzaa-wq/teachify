"use client";

import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui";

interface HealthMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  color?: "primary" | "success" | "warning" | "destructive";
}

const barColorMap = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

interface SystemHealthCardProps {
  metrics: HealthMetric[];
  loading?: boolean;
}

function SystemHealthCard({ metrics, loading }: SystemHealthCardProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {metrics.map((metric) => {
        const percentage = Math.min((metric.value / metric.max) * 100, 100);
        const color = metric.color ?? (percentage > 80 ? "destructive" : percentage > 60 ? "warning" : "success");

        return (
          <div key={metric.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground/80">{metric.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {metric.value}/{metric.max} {metric.unit}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  barColorMap[color],
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { SystemHealthCard };
