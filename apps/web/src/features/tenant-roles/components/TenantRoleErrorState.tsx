"use client";

import { AppErrorState } from "@/components/ui";

interface TenantRoleErrorStateProps {
  onRetry: () => void;
}

function TenantRoleErrorState({ onRetry }: TenantRoleErrorStateProps) {
  return (
    <AppErrorState
      title="حدث خطأ في تحميل الأدوار"
      description="تعذّر تحميل قائمة الأدوار. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      onRetry={onRetry}
    />
  );
}

export { TenantRoleErrorState };
