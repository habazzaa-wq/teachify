"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

interface AppMetricProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

function AppMetric({
  label,
  value,
  prefix,
  suffix,
  trend,
  icon: Icon,
  loading,
  className,
  valueClassName,
}: AppMetricProps) {
  if (loading) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-28" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{label}</span>
      </div>
      <div className={cn("flex items-baseline gap-2", valueClassName)}>
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {prefix}{value}{suffix}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive",
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

export { AppMetric, type AppMetricProps };
