"use client";

import { Activity, Plus, Check, Archive, Pencil } from "lucide-react";
import type { Category } from "../types";
import { formatDateTime } from "@/lib/format";

interface CategoryActivityTabProps {
  category: Category;
}

function CategoryActivityTab({ category }: CategoryActivityTabProps) {
  const activities = [
    {
      action: "created",
      description: "تم إنشاء التصنيف",
      timestamp: category.createdAt,
    },
    ...(category.updatedAt !== category.createdAt
      ? [{
          action: "updated" as const,
          description: "آخر تحديث للتصنيف",
          timestamp: category.updatedAt,
        }]
      : []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const actionColors: Record<string, string> = {
    created: "bg-primary",
    updated: "bg-warning",
  };

  const actionIcons: Record<string, React.ReactNode> = {
    created: <Plus className="h-3 w-3" />,
    updated: <Pencil className="h-3 w-3" />,
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Activity className="h-4 w-4" />
        النشاطات
      </h4>
      <div className="relative">
        <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {activities.map((activity, i) => (
            <div key={i} className="relative flex items-start gap-4">
              <div className={`relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${actionColors[activity.action] ?? "bg-muted-foreground"}`}>
                {actionIcons[activity.action] ?? <Activity className="h-3 w-3" />}
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { CategoryActivityTab };