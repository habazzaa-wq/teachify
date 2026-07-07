"use client";

import { BookOpen } from "lucide-react";
import { AppEmptyState, AppButton } from "@/components/ui";

interface LessonEmptyStateProps {
  onCreate?: () => void;
}

function LessonEmptyState({ onCreate }: LessonEmptyStateProps) {
  return (
    <AppEmptyState
      icon={BookOpen}
      title="لا توجد دروس"
      description="لم يتم إضافة أي دروس بعد. أضف أول درس لبدء إنشاء المحتوى التعليمي."
      action={
        onCreate
          ? <AppButton size="sm" onClick={onCreate}>إضافة درس</AppButton>
          : undefined
      }
    />
  );
}

export { LessonEmptyState };
