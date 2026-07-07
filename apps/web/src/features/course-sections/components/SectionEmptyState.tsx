"use client";

import { BookOpen } from "lucide-react";
import { AppEmptyState, AppButton } from "@/components/ui";

interface SectionEmptyStateProps {
  onCreate?: () => void;
}

function SectionEmptyState({ onCreate }: SectionEmptyStateProps) {
  return (
    <AppEmptyState
      icon={BookOpen}
      title="لا توجد أقسام"
      description="لم يتم إضافة أي أقسام بعد. أضف أول قسم لبدء تنظيم محتوى الدورة."
      action={
        onCreate
          ? <AppButton size="sm" onClick={onCreate}>إضافة قسم</AppButton>
          : undefined
      }
    />
  );
}

export { SectionEmptyState };
