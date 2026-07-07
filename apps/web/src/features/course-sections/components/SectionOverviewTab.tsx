"use client";

import { Clock, Eye, Lock, Star, Hash, Layers, Palette, Tag } from "lucide-react";
import type { CourseSection } from "../types";
import { formatDate } from "@/lib/format";

interface SectionOverviewTabProps {
  section: CourseSection;
}

function SectionOverviewTab({ section }: SectionOverviewTabProps) {
  const details = [
    { icon: Hash, label: "الترتيب", value: section.order },
    { icon: Clock, label: "المدة", value: section.durationMinutes ? `${section.durationMinutes} دقيقة` : "—" },
    { icon: Layers, label: "عدد الدروس", value: section.lessonsCount },
    { icon: Eye, label: "معاينة مجانية", value: section.freePreview ? "نعم" : "لا" },
    { icon: Lock, label: "مقفل", value: section.locked ? "نعم" : "لا" },
    { icon: Star, label: "مميز", value: section.featured ? "نعم" : "لا" },
    { icon: Palette, label: "اللون", value: section.color ? (
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: section.color }} />
        {section.color}
      </span>
    ) : "—" },
    { icon: Tag, label: "الأيقونة", value: section.icon ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">الوصف</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {section.description || "لا يوجد وصف"}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">المعلومات</h4>
        <div className="grid gap-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</h4>
          <p className="text-sm font-medium">{formatDate(section.createdAt)}</p>
        </div>
        <div>
          <h4 className="text-xs text-muted-foreground mb-1">آخر تحديث</h4>
          <p className="text-sm font-medium">{formatDate(section.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}

export { SectionOverviewTab };
