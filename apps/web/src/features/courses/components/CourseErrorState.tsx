"use client";

import { AppErrorState } from "@/components/ui";

interface CourseErrorStateProps {
  onRetry: () => void;
}

function CourseErrorState({ onRetry }: CourseErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل الدورات"
      description="تعذّر تحميل قائمة الدورات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { CourseErrorState };
