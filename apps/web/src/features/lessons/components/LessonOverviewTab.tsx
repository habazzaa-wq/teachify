"use client";

import { Clock, Eye, Star, Download, MessageSquare, Hash, Palette, Tag, Globe, Video, FileText, File, Radio } from "lucide-react";
import type { Lesson } from "../types";
import { formatDate } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  video: "فيديو",
  text: "نص",
  pdf: "PDF",
  external: "خارجي",
  live: "مباشر",
};

const TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  text: FileText,
  pdf: File,
  external: Globe,
  live: Radio,
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: "خاص",
  preview: "معاينة",
  public: "عام",
};

interface LessonOverviewTabProps {
  lesson: Lesson;
}

function LessonOverviewTab({ lesson }: LessonOverviewTabProps) {
  const TypeIcon = TYPE_ICONS[lesson.lessonType] ?? Video;

  const details = [
    { icon: Hash, label: "الترتيب", value: lesson.order },
    { icon: TypeIcon, label: "النوع", value: TYPE_LABELS[lesson.lessonType] ?? lesson.lessonType },
    { icon: Globe, label: "الرؤية", value: VISIBILITY_LABELS[lesson.visibility] ?? lesson.visibility },
    { icon: Clock, label: "المدة", value: lesson.estimatedDuration ? `${lesson.estimatedDuration} دقيقة` : lesson.durationSeconds ? `${Math.round(lesson.durationSeconds / 60)} دقيقة` : "—" },
    { icon: Eye, label: "معاينة مجانية", value: lesson.freePreview ? "نعم" : "لا" },
    { icon: Star, label: "مميز", value: lesson.featured ? "نعم" : "لا" },
    { icon: Download, label: "قابل للتحميل", value: lesson.downloadable ? "نعم" : "لا" },
    { icon: MessageSquare, label: "التعليقات", value: lesson.commentsEnabled ? "مفعلة" : "معطلة" },
    { icon: Palette, label: "اللون", value: lesson.color ? (
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: lesson.color }} />
        {lesson.color}
      </span>
    ) : "—" },
    { icon: Tag, label: "الأيقونة", value: lesson.icon ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">الوصف القصير</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lesson.shortDescription || "لا يوجد وصف قصير"}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">الوصف</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lesson.description || "لا يوجد وصف"}
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
          <p className="text-sm font-medium">{formatDate(lesson.createdAt)}</p>
        </div>
        <div>
          <h4 className="text-xs text-muted-foreground mb-1">آخر تحديث</h4>
          <p className="text-sm font-medium">{formatDate(lesson.updatedAt)}</p>
        </div>
        {lesson.publishedAt && (
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">تاريخ النشر</h4>
            <p className="text-sm font-medium">{formatDate(lesson.publishedAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { LessonOverviewTab };
