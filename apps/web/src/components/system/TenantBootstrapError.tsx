"use client";

import { AppButton } from "@/components/ui/AppButton";

interface TenantBootstrapErrorProps {
  error: string;
  onRetry?: () => void;
}

export function TenantBootstrapError({
  error,
  onRetry,
}: TenantBootstrapErrorProps) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          تعذّر تحميل البيئة التعليمية
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error}
        </p>
      </div>

      {onRetry && (
        <AppButton onClick={onRetry}>
          إعادة المحاولة
        </AppButton>
      )}
    </div>
  );
}
