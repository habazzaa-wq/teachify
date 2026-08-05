"use client";

import { useState, useEffect, useCallback } from "react";
import { StudioDialog } from "@/components/studio/overlays/StudioDialog";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioInput } from "@/components/studio/primitives/StudioInput";
import { StudioTextarea } from "@/components/studio/primitives/StudioTextarea";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import type { ContentItemType } from "@/features/course-content/types";

interface CourseStudioContentDetailsDialogProps {
  open: boolean;
  type: ContentItemType | null;
  defaultTitle?: string;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  saving?: boolean;
}

export function CourseStudioContentDetailsDialog({
  open,
  type,
  defaultTitle,
  onClose,
  onSave,
  saving,
}: CourseStudioContentDetailsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle ?? "");
      setDescription("");
    }
  }, [open, defaultTitle]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onSave(title.trim(), description.trim());
    },
    [title, description, onSave],
  );

  const typeLabel = type ? CONTENT_TYPE_CONFIG[type]?.label ?? "المحتوى" : "المحتوى";

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title="معلومات المحتوى"
      description="أضف اسم ومعلومات عن المحتوى قبل إضافته إلى القسم"
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
            disabled={!title.trim()}
          >
            إضافة المحتوى
          </StudioButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <StudioInput
          label="اسم المحتوى"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`أدخل اسم الـ${typeLabel}`}
          autoFocus
          required
        />        <StudioTextarea
          label="معلومات عن المحتوى"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أضف وصفاً أو معلومات إضافية عن المحتوى (اختياري)"
          rows={4}
        />
      </form>
    </StudioDialog>
  );
}
