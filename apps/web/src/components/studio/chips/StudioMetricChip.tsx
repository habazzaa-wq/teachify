"use client";

import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StudioMetricChipProps {
  value: string;
  label: string;
  trend?: "up" | "down";
  className?: string;
}

export function StudioMetricChip({
  value,
  label,
  trend,
  className,
}: StudioMetricChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-studio-border bg-studio-surface px-3 py-1.5",
        className,
      )}
    >
      <div className="text-right">
        <p className="text-sm font-semibold text-studio-fg">{value}</p>
        <p className="text-[10px] text-studio-fg-muted uppercase tracking-wider">{label}</p>
      </div>
      {trend && (
        <span className={cn(trend === "up" ? "text-studio-success" : "text-studio-danger")}>
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
        </span>
      )}
    </div>
  );
}
