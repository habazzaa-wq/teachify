"use client";

import { Users, Plus } from "lucide-react";
import { AppEmptyState, AppButton } from "@/components/ui";

interface StudentEmptyStateProps {
  hasFilters: boolean;
  onCreate?: () => void;
}

function StudentEmptyState({ hasFilters, onCreate }: StudentEmptyStateProps) {
  return (
    <AppEmptyState
      icon={Users}
      title={hasFilters ? "لا توجد نتائج" : "لا يوجد طلاب بعد"}
      description={hasFilters ? "جرب تغيير معايير البحث أو الفلتر" : "سيظهر هنا الطلاب المسجلين في الأكاديمية"}
      action={
        !hasFilters && onCreate ? (
          <AppButton size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            إضافة طالب
          </AppButton>
        ) : undefined
      }
    />
  );
}

export { StudentEmptyState };
