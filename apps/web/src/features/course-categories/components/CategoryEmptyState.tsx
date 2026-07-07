"use client";

import { FolderOpen, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface CategoryEmptyStateProps {
  onCreate: () => void;
}

function CategoryEmptyState({ onCreate }: CategoryEmptyStateProps) {
  return (
    <AppEmptyState
      icon={FolderOpen}
      title="لا يوجد تصنيفات حتى الآن"
      description="لم يتم إضافة أي تصنيفات بعد. ابدأ بإنشاء أول تصنيف لتنظيم الدورات."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة تصنيف
        </AppButton>
      }
    />
  );
}

export { CategoryEmptyState };