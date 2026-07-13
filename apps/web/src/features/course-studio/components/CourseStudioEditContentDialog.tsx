"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import type { ContentItem } from "@/features/course-content/types";

interface CourseStudioEditContentDialogProps {
  open: boolean;
  item: ContentItem | null;
  onClose: () => void;
  onSave: (title: string) => void;
  saving?: boolean;
}

export function CourseStudioEditContentDialog({
  open,
  item,
  onClose,
  onSave,
  saving,
}: CourseStudioEditContentDialogProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (item && open) {
      setTitle(item.title);
    }
  }, [item, open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onSave(title.trim());
    },
    [title, onSave],
  );

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title="تعديل المحتوى"
      description="تحديث عنوان المحتوى"
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
          label="عنوان المحتوى"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل عنوان المحتوى"
          autoFocus
        />
      </form>
    </StudioDialog>
  );
}
