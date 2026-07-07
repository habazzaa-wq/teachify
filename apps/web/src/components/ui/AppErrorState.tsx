"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { AppButton } from "./AppButton";
import { cn } from "@/lib/cn";

interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  variant?: "default" | "card" | "inline";
}

function AppErrorState({
  title = "حدث خطأ",
  description = "تعذّر تحميل المحتوى. حاول مرة أخرى.",
  onRetry,
  className,
  variant = "default",
}: AppErrorStateProps) {
  const isInline = variant === "inline";

  if (isInline) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm",
          className,
        )}
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        <span className="flex-1 text-destructive">{title}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/[0.02] p-12 text-center",
        variant === "card" && "bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <AppButton variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة المحاولة
        </AppButton>
      )}
    </div>
  );
}

export { AppErrorState, type AppErrorStateProps };
