import { Clock, Star, FolderOpen, Palette, Type, Calendar } from "lucide-react";
import type { CourseModule } from "../types";

interface ModuleOverviewTabProps {
  module: CourseModule;
}

export function ModuleOverviewTab({ module }: ModuleOverviewTabProps) {
  const items = [
    { label: "الترتيب", value: module.order, icon: Type },
    { label: "المدة", value: module.estimatedDuration ? `${module.estimatedDuration} دقيقة` : "—", icon: Clock },
    { label: "الأقسام", value: module.sectionsCount, icon: FolderOpen },
    { label: "مميز", value: module.featured ? "نعم" : "لا", icon: Star },
    { label: "اللون", value: module.color ?? "—", icon: Palette },
    { label: "تاريخ الإنشاء", value: new Date(module.createdAt).toLocaleDateString("ar-SA"), icon: Calendar },
  ];

  return (
    <div className="space-y-4 pt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
      {module.description && (
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-1">الوصف</p>
          <p className="text-sm">{module.description}</p>
        </div>
      )}
    </div>
  );
}
