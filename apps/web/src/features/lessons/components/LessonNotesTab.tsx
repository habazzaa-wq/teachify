"use client";

import { FileText } from "lucide-react";

interface LessonNotesTabProps {
  notes: string | null;
}

function LessonNotesTab({ notes }: LessonNotesTabProps) {
  if (!notes) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 className="text-sm font-medium text-foreground mb-1">
          لا توجد ملاحظات
        </h4>
        <p className="text-sm text-muted-foreground max-w-sm">
          لم يتم إضافة أي ملاحظات داخلية لهذا الدرس.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">ملاحظات داخلية</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {notes}
        </p>
      </div>
    </div>
  );
}

export { LessonNotesTab };
