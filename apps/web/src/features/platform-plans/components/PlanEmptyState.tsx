"use client";

import { Package, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface PlanEmptyStateProps {
  onCreate: () => void;
}

function PlanEmptyState({ onCreate }: PlanEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Package}
      title="لا توجد باقات حتى الآن"
      description="لم يتم إنشاء أي باقات بعد. ابدأ بإضافة أول باقة إلى المنصة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إنشاء أول باقة
        </AppButton>
      }
    />
  );
}

export { PlanEmptyState };
