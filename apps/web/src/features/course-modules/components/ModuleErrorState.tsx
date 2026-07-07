"use client";

import { AppErrorState } from "@/components/ui";

interface ModuleErrorStateProps {
  onRetry?: () => void;
}

export function ModuleErrorState({ onRetry }: ModuleErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل الوحدات"
      description="يرجى المحاولة مرة أخرى"
      onRetry={onRetry}
    />
  );
}
