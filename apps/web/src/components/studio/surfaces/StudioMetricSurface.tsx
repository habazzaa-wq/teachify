"use client";

import { cn } from "@/lib/cn";

interface StudioMetricSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  trend?: "up" | "down" | "neutral";
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function StudioMetricSurface({
  className,
  trend = "neutral",
  value,
  label,
  icon,
  ...props
}: StudioMetricSurfaceProps) {
  const trendColors = {
    up: "text-studio-success",
    down: "text-studio-danger",
    neutral: "text-studio-fg-muted",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-studio-border bg-studio-surface p-5 transition-all duration-150 hover:border-studio-accent-border",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-studio-fg-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-studio-fg">
            {value}
          </p>
        </div>
        {icon && (
          <div className="rounded-lg bg-studio-accent-soft p-2.5 text-studio-accent">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
