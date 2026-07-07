"use client";

import { AppErrorState } from "@/components/ui";

interface PlanErrorStateProps {
  onRetry: () => void;
}

function PlanErrorState({ onRetry }: PlanErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل الباقات"
      description="تعذّر تحميل قائمة الباقات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { PlanErrorState };
