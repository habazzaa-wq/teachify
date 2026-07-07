"use client";

import { BookOpen, Plus } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface CourseEmptyStateProps {
  onCreate: () => void;
}

function CourseEmptyState({ onCreate }: CourseEmptyStateProps) {
  return (
    <AppEmptyState
      icon={BookOpen}
      title="لا يوجد دورات حتى الآن"
      description="لم يتم إضافة أي دورات بعد. ابدأ بإنشاء أول دورة تدريبية."
      action={
        <AppButton size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة دورة
        </AppButton>
      }
    />
  );
}

export { CourseEmptyState };
