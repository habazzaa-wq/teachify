"use client";

import { AppErrorState } from "@/components/ui";

interface ExamErrorStateProps {
  onRetry: () => void;
}

export function ExamErrorState({ onRetry }: ExamErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <AppErrorState
        title="تعذّر تحميل الاختبارات"
        description="حدث خطأ أثناء جلب بيانات مكتبة الاختبارات. حاول مرة أخرى."
        onRetry={onRetry}
      />
    </div>
  );
}

export default ExamErrorState;
