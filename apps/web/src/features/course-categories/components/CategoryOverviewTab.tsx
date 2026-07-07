"use client";

import { FolderOpen, Globe, BookOpen, Hash, Star, Eye, Calendar, Layers } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { CATEGORY_STATUS_CONFIG, DEFAULT_COLORS } from "../constants";
import type { Category } from "../types";

interface CategoryOverviewTabProps {
  category: Category;
}

function CategoryOverviewTab({ category }: CategoryOverviewTabProps) {
  const statusConfig = CATEGORY_STATUS_CONFIG[category.active ? "active" : "inactive"];

  const infoCards = [
    { icon: Globe, label: "المعرّف", value: category.slug },
    { icon: FolderOpen, label: "التصنيف الأب", value: category.parent?.name ?? "—" },
    { icon: Layers, label: "التصنيفات الفرعية", value: String(category.children?.length ?? 0) },
    { icon: BookOpen, label: "الدورات", value: String(category.coursesCount) },
    { icon: Star, label: "مميز", value: category.featured ? "نعم" : "لا" },
    { icon: Eye, label: "الحالة", value: statusConfig.label },
    { icon: Hash, label: "الترتيب", value: String(category.sortOrder) },
    { icon: Calendar, label: "تاريخ الإنشاء", value: formatDate(category.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"}>
          {statusConfig.label}
        </AppBadge>
        {category.featured && (
          <AppBadge variant="warning">
            <Star className="h-3 w-3 me-1" />
            مميز
          </AppBadge>
        )}
        {category.color && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md border text-xs">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
            {category.color}
          </div>
        )}
        {category.icon && (
          <AppBadge variant="outline">{category.icon}</AppBadge>
        )}
      </div>

      {category.description && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">الوصف</h4>
          <p className="text-sm">{category.description}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {infoCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-sm font-medium truncate">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CategoryOverviewTab };