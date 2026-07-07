"use client";

import { Key, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface TenantPermissionEmptyStateProps {
  onCreate: () => void;
}

function TenantPermissionEmptyState({ onCreate }: TenantPermissionEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Key}
      title="لا يوجد صلاحيات حتى الآن"
      description="لم يتم إضافة أي صلاحيات بعد. ابدأ بإضافة أول صلاحية إلى المؤسسة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة صلاحية
        </AppButton>
      }
    />
  );
}

export { TenantPermissionEmptyState };
