"use client";

import { AppErrorState } from "@/components/ui";

interface TenantErrorStateProps {
  onRetry: () => void;
}

function TenantErrorState({ onRetry }: TenantErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل المؤسسات"
      description="تعذّر تحميل قائمة المؤسسات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { TenantErrorState };
