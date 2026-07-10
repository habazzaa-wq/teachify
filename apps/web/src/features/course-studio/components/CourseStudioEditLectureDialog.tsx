"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import { StudioTextarea } from "@/components/studio/primitives/StudioTextarea";
import type {
  CourseModule,
  UpdateCourseModulePayload,
} from "@/features/course-modules/types";

interface CourseStudioEditLectureDialogProps {
  open: boolean;
  lecture: CourseModule | null;
  onClose: () => void;
  onSave: (payload: UpdateCourseModulePayload) => void;
  saving?: boolean;
}

export function CourseStudioEditLectureDialog({
  open,
  lecture,
  onClose,
  onSave,
  saving,
}: CourseStudioEditLectureDialogProps) {
  const [formData, setFormData] = useState<UpdateCourseModulePayload>({
    title: "",
    description: "",
    order: 0,
  });

  useEffect(() => {
    if (lecture && open) {
      setFormData({
        title: lecture.title,
        description: lecture.description ?? "",
        order: lecture.order,
      });
    }
  }, [lecture, open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title?.trim()) return;
      onSave(formData);
    },
    [formData, onSave],
  );

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title="تعديل المحاضرة"
      description="تحديث معلومات المحاضرة"
      size="md"
      footer={
        <>
          <StudioButton variant="ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </StudioButton>
          <StudioButton
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
          >
            حفظ التغييرات
          </StudioButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <StudioInput
          label="عنوان المحاضرة"
          value={formData.title ?? ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, title: e.target.value }))
          }
          placeholder="أدخل عنوان المحاضرة"
          autoFocus
        />

        <StudioTextarea
          label="وصف قصير"
          value={formData.description ?? ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="وصف المحاضرة (اختياري)"
          rows={3}
        />

        <StudioInput
          label="الترتيب"
          type="number"
          min={0}
          value={String(formData.order ?? lecture?.order ?? 0)}
          onChange={(e) =>
            setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))
          }
        />
      </form>
    </StudioDialog>
  );
}
