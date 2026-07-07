"use client";

import { AppErrorState } from "@/components/ui";

interface TenantUserErrorStateProps {
  onRetry: () => void;
}

function TenantUserErrorState({ onRetry }: TenantUserErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل المستخدمين"
      description="تعذّر تحميل قائمة المستخدمين. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { TenantUserErrorState };
