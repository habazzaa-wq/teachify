"use client";

import { Layers } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface ModuleEmptyStateProps {
  onCreate?: () => void;
  canCreate?: boolean;
}

export function ModuleEmptyState({ onCreate, canCreate }: ModuleEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Layers}
      title="لا توجد وحدات بعد"
      description="ابدأ بإضافة وحدات لبناء منهج الكورس."
      action={
        canCreate && onCreate ? (
          <AppButton onClick={onCreate}>إضافة وحدة</AppButton>
        ) : undefined
      }
    />
  );
}
