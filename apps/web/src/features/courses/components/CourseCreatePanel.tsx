"use client";

import { CourseFormPanel } from "./CourseFormPanel";
import type { CreateCoursePayload } from "../types";

interface CourseCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateCoursePayload) => void;
  saving?: boolean;
  instructorToken?: string | null;
}

function CourseCreatePanel({ open, onOpenChange, onSave, saving, instructorToken }: CourseCreatePanelProps) {
  return (
    <CourseFormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة دورة جديدة"
      formKey="create"
      onSave={onSave}
      saving={saving}
      instructorToken={instructorToken}
      footerNote="سيتم إنشاء الدورة كمسودة"
    />
  );
}

export { CourseCreatePanel };
