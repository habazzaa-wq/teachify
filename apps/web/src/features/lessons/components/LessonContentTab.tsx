"use client";

import { FileText } from "lucide-react";
import type { Lesson } from "../types";

interface LessonContentTabProps {
  lesson: Lesson;
}

function LessonContentTab({ lesson }: LessonContentTabProps) {
  const contentTypes: Record<string, string> = {
    video: "محتوى الفيديو",
    text: "محتوى النص",
    pdf: "ملف PDF",
    external: "محتوى خارجي",
    live: "جلسة مباشرة",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">
        {contentTypes[lesson.lessonType] ?? "المحتوى"}
      </h4>
      <p className="text-sm text-muted-foreground max-w-sm">
        سيتم تنفيذ إدارة المحتوى في مرحلة لاحقة.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        نوع الدرس: {lesson.lessonType}
      </p>
    </div>
  );
}

export { LessonContentTab };
