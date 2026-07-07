"use client";

import { BookOpen } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Category } from "../types";

interface CategoryCoursesTabProps {
  category: Category;
}

function CategoryCoursesTab({ category }: CategoryCoursesTabProps) {
  const coursesCount = category.coursesCount;

  if (coursesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">لا توجد دورات</h3>
        <p className="text-xs text-muted-foreground">
          هذا التصنيف لا يحتوي على أي دورات بعد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الدورات</p>
            <p className="text-2xl font-bold">{formatNumber(coursesCount)}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        لعرض قائمة الدورات الخاصة بهذا التصنيف، يرجى الذهاب إلى صفحة إدارة الدورات وتصفية حسب التصنيف.
      </p>
    </div>
  );
}

export { CategoryCoursesTab };