"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import { StudioTextarea } from "@/components/studio/primitives/StudioTextarea";
import { StudioSwitch } from "@/components/studio/primitives/StudioSwitch";
import type { CourseSection, UpdateCourseSectionPayload } from "@/features/course-sections/types";

interface CourseStudioEditSectionDialogProps {
  open: boolean;
  section: CourseSection | null;
  onClose: () => void;
  onSave: (payload: UpdateCourseSectionPayload) => void;
  saving?: boolean;
}

export function CourseStudioEditSectionDialog({
  open,
  section,
  onClose,
  onSave,
  saving,
}: CourseStudioEditSectionDialogProps) {
  const [formData, setFormData] = useState<UpdateCourseSectionPayload>({
    title: "",
    description: null,
    free_preview: false,
  });

  useEffect(() => {
    if (section && open) {
      setFormData({
        title: section.title,
        description: section.description ?? null,
        sort_order: section.order,
        free_preview: section.freePreview,
      });
    }
  }, [section, open]);

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
      title="تعديل القسم"
      description="تحديث معلومات القسم"
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
          label="عنوان القسم"
          value={formData.title ?? ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, title: e.target.value }))
          }
          placeholder="أدخل عنوان القسم"
          autoFocus
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
          value={String(formData.sort_order ?? section?.order ?? 0)}
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
