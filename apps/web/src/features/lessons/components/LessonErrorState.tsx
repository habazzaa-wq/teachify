"use client";

import { AppErrorState } from "@/components/ui";

interface LessonErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

function LessonErrorState({ message, onRetry }: LessonErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ"
      description={message ?? "تعذر تحميل الدروس. يرجى المحاولة مرة أخرى."}
      onRetry={onRetry}
    />
  );
}

export { LessonErrorState };
