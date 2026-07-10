"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import { StudioTextarea } from "@/components/studio/primitives/StudioTextarea";
import { StudioSwitch } from "@/components/studio/primitives/StudioSwitch";
import type { CreateCourseSectionPayload } from "@/features/course-sections/types";

interface CourseStudioCreateSectionDialogProps {
  open: boolean;
  lectureId: string | null;
  onClose: () => void;
  onSave: (payload: CreateCourseSectionPayload) => void;
  saving?: boolean;
  nextOrder?: number;
}

const INITIAL_FORM: CreateCourseSectionPayload = {
  title: "",
  description: null,
  free_preview: false,
};

export function CourseStudioCreateSectionDialog({
  open,
  lectureId,
  onClose,
  onSave,
  saving,
  nextOrder = 0,
}: CourseStudioCreateSectionDialogProps) {
  const [formData, setFormData] = useState<CreateCourseSectionPayload>(INITIAL_FORM);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({ ...INITIAL_FORM, sort_order: nextOrder });
      setTitleError(null);
    }
  }, [open, nextOrder]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        setTitleError("عنوان القسم مطلوب");
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
      title="إضافة قسم جديد"
      description="أدخل معلومات القسم الجديد"
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
          label="عنوان القسم"
          value={formData.title}
          onChange={(e) => {
            setFormData((p) => ({ ...p, title: e.target.value }));
            if (titleError) setTitleError(null);
          }}
          placeholder="أدخل عنوان القسم"
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
          placeholder="وصف القسم (اختياري)"
          rows={3}
        />

        <StudioInput
          label="الترتيب"
          type="number"
          min={0}
          value={String(formData.sort_order ?? nextOrder)}
          onChange={(e) =>
            setFormData((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))
          }
        />

        <StudioSwitch
          label="معاينة مجانية"
          checked={formData.free_preview ?? false}
          onCheckedChange={(checked) =>
            setFormData((p) => ({ ...p, free_preview: checked }))
          }
        />
      </form>
    </StudioDialog>
  );
}
