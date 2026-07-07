"use client";

import { FolderOpen, FolderClosed, Star, Eye } from "lucide-react";
import { AppTable, AppTableHeader, AppTableBody, AppTableRow, AppTableHead, AppTableCell, AppBadge } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { CATEGORY_STATUS_CONFIG } from "../constants";
import type { Category } from "../types";

interface CategoryChildrenTabProps {
  category: Category;
}

function CategoryChildrenTab({ category }: CategoryChildrenTabProps) {
  const children = category.children ?? [];

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FolderClosed className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">لا توجد تصنيفات فرعية</h3>
        <p className="text-xs text-muted-foreground">
          هذا التصنيف لا يحتوي على أي تصنيفات فرعية.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="overflow-x-auto">
        <AppTable>
          <AppTableHeader>
            <AppTableRow>
              <AppTableHead>الاسم</AppTableHead>
              <AppTableHead>المعرّف</AppTableHead>
              <AppTableHead>الدورات</AppTableHead>
              <AppTableHead>الحالة</AppTableHead>
              <AppTableHead>مميز</AppTableHead>
              <AppTableHead>الترتيب</AppTableHead>
            </AppTableRow>
          </AppTableHeader>
          <AppTableBody>
            {children.map((child) => {
              const childStatusConfig = CATEGORY_STATUS_CONFIG[child.active ? "active" : "inactive"];
              return (
                <AppTableRow key={child.id}>
                  <AppTableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{child.name}</p>
                      {child.featured && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                  </AppTableCell>
                  <AppTableCell className="text-xs text-muted-foreground">{child.slug}</AppTableCell>
                  <AppTableCell className="tabular-nums text-sm">{formatNumber(child.coursesCount)}</AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={childStatusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"} className="text-[10px]">
                      {childStatusConfig.label}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell className="text-xs text-muted-foreground">{child.featured ? "نعم" : "لا"}</AppTableCell>
                  <AppTableCell className="tabular-nums text-xs text-muted-foreground">{child.sortOrder}</AppTableCell>
                </AppTableRow>
              );
            })}
          </AppTableBody>
        </AppTable>
      </div>
    </div>
  );
}

export { CategoryChildrenTab };