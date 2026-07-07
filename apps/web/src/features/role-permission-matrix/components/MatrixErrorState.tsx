"use client";

import { AppErrorState } from "@/components/ui";

interface MatrixErrorStateProps {
  onRetry: () => void;
}

function MatrixErrorState({ onRetry }: MatrixErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل المصفوفة"
      description="تعذّر تحميل مصفوفة الصلاحيات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { MatrixErrorState };
