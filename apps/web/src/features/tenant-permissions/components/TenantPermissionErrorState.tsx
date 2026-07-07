"use client";

import { AppErrorState } from "@/components/ui";

interface TenantPermissionErrorStateProps {
  onRetry: () => void;
}

function TenantPermissionErrorState({ onRetry }: TenantPermissionErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل الصلاحيات"
      description="تعذّر تحميل قائمة الصلاحيات. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { TenantPermissionErrorState };
