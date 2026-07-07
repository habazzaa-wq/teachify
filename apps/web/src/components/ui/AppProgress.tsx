"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface AppProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "destructive";
  showLabel?: boolean;
  animated?: boolean;
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function AppProgress({
  value = 0,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  animated = true,
  className,
  ...props
}: AppProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          sizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantStyles[variant],
            animated && "animate-in",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-end text-xs font-medium text-muted-foreground">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

export { AppProgress, type AppProgressProps };
