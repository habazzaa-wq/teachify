"use client";

import { AppErrorState } from "@/components/ui";

interface DomainErrorStateProps {
  onRetry: () => void;
}

function DomainErrorState({ onRetry }: DomainErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل النطاقات"
      description="تعذّر تحميل قائمة النطاقات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { DomainErrorState };
