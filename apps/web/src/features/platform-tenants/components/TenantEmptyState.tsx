"use client";

import { Building2, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface TenantEmptyStateProps {
  onCreate: () => void;
}

function TenantEmptyState({ onCreate }: TenantEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Building2}
      title="لا توجد مؤسسات حتى الآن"
      description="لم يتم إنشاء أي مؤسسات بعد. ابدأ بإضافة أول مؤسسة إلى المنصة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إنشاء أول مؤسسة
        </AppButton>
      }
    />
  );
}

export { TenantEmptyState };
