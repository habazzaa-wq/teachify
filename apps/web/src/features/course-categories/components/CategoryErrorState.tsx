"use client";

import { AppErrorState } from "@/components/ui";

interface CategoryErrorStateProps {
  onRetry: () => void;
}

function CategoryErrorState({ onRetry }: CategoryErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل التصنيفات"
      description="تعذّر تحميل قائمة التصنيفات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { CategoryErrorState };