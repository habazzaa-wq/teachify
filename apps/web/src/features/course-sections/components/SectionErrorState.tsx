"use client";

import { AppErrorState } from "@/components/ui";

interface SectionErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

function SectionErrorState({ message, onRetry }: SectionErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ"
      description={message ?? "تعذر تحميل الأقسام. يرجى المحاولة مرة أخرى."}
      onRetry={onRetry}
    />
  );
}

export { SectionErrorState };
