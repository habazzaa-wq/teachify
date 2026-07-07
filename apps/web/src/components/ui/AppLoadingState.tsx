"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface AppLoadingStateProps {
  label?: string;
  className?: string;
  variant?: "default" | "spinner" | "skeleton";
  rows?: number;
}

function AppLoadingState({
  label = "جارٍ التحميل...",
  className,
  variant = "default",
  rows = 3,
}: AppLoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded-md bg-muted"
            style={{ width: `${80 - i * 15}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-12 text-center",
        className,
      )}
    >
      <div className="relative">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary/60" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export { AppLoadingState, type AppLoadingStateProps };
