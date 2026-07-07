"use client";

import { FileText } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Category } from "../types";

interface CategoryNotesTabProps {
  category: Category;
}

function CategoryNotesTab({ category }: CategoryNotesTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          معلومات إضافية
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">الاسم</p>
            <p className="text-sm font-medium">{category.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">المعرّف (Slug)</p>
            <p className="text-sm font-medium font-mono" dir="ltr">{category.slug}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
            <p className="text-sm font-medium">{formatDate(category.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">آخر تحديث</p>
            <p className="text-sm font-medium">{formatDate(category.updatedAt)}</p>
          </div>
          {category.deletedAt && (
            <div>
              <p className="text-xs text-muted-foreground text-destructive">تاريخ الحذف</p>
              <p className="text-sm font-medium text-destructive">{formatDate(category.deletedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { CategoryNotesTab };