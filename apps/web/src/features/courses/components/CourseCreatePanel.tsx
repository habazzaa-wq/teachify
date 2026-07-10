"use client";

import { CourseFormPanel } from "./CourseFormPanel";
import type { CreateCoursePayload } from "../types";

interface CourseCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateCoursePayload) => void;
  saving?: boolean;
}

function CourseCreatePanel({ open, onOpenChange, onSave, saving }: CourseCreatePanelProps) {
  return (
    <CourseFormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة دورة جديدة"
      formKey="create"
      onSave={onSave}
      saving={saving}
      footerNote="سيتم إنشاء الدورة كمسودة"
    />
  );
}

export { CourseCreatePanel };
