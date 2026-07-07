"use client";

import { Shield, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface TenantRoleEmptyStateProps {
  onCreate: () => void;
}

function TenantRoleEmptyState({ onCreate }: TenantRoleEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Shield}
      title="لا يوجد أدوار حتى الآن"
      description="لم يتم إضافة أي أدوار بعد. ابدأ بإضافة أول دور إلى المؤسسة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة دور
        </AppButton>
      }
    />
  );
}

export { TenantRoleEmptyState };
