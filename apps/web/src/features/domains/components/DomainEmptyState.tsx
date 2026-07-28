"use client";

import { Globe, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface DomainEmptyStateProps {
  onCreate: () => void;
}

function DomainEmptyState({ onCreate }: DomainEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Globe}
      title="لا توجد نطاقات حتى الآن"
      description="لم يتم إضافة أي نطاقات بعد. ابدأ بإضافة أول نطاق إلى المنصة."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة نطاق
        </AppButton>
      }
    />
  );
}

export { DomainEmptyState };
