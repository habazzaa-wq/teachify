"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import { StudioTextarea } from "@/components/studio/primitives/StudioTextarea";
import type { CreateCourseModulePayload } from "@/features/course-modules/types";

interface CourseStudioCreateLectureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateCourseModulePayload) => void;
  saving?: boolean;
  nextOrder?: number;
}

const INITIAL_FORM: CreateCourseModulePayload = {
  title: "",
  description: null,
  order: 0,
};

export function CourseStudioCreateLectureDialog({
  open,
  onClose,
  onSave,
  saving,
  nextOrder = 0,
}: CourseStudioCreateLectureDialogProps) {
  const [formData, setFormData] = useState<CreateCourseModulePayload>(INITIAL_FORM);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({ ...INITIAL_FORM, order: nextOrder });
      setTitleError(null);
    }
  }, [open, nextOrder]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        setTitleError("عنوان المحاضرة مطلوب");
        return;
      }
      setTitleError(null);
      onSave({
        ...formData,
        description: formData.description || null,
      });
    },
    [formData, onSave],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title="إضافة محاضرة جديدة"
      description="أدخل معلومات المحاضرة الجديدة"
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
            حفظ
          </StudioButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <StudioInput
          label="عنوان المحاضرة"
          value={formData.title}
          onChange={(e) => {
            setFormData((p) => ({ ...p, title: e.target.value }));
            if (titleError) setTitleError(null);
          }}
          placeholder="أدخل عنوان المحاضرة"
          error={titleError ?? undefined}
          autoFocus
          onKeyDown={handleKeyDown}
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
          value={String(formData.order ?? nextOrder)}
          onChange={(e) =>
            setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))
          }
        />
      </form>
    </StudioDialog>
  );
}
