"use client";

import { Users, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface TenantUserEmptyStateProps {
  onCreate: () => void;
}

function TenantUserEmptyState({ onCreate }: TenantUserEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Users}
      title="لا يوجد مستخدمون حتى الآن"
      description="لم يتم إضافة أي مستخدمين بعد. ابدأ بإضافة أول مستخدم إلى المؤسسة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </AppButton>
      }
    />
  );
}

export { TenantUserEmptyState };
