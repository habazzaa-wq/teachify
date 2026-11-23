"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle, AppDialogDescription,
  AppButton, AppInput, AppTextarea,
} from "@/components/ui";

export interface ExternalLinkValue {
  title: string;
  external_url: string;
  short_description: string;
}

interface Props {
  open: boolean;
  initial?: Partial<ExternalLinkValue> | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: ExternalLinkValue) => void | Promise<void>;
}

export function CourseStudioExternalLinkDialog({ open, initial, saving, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setUrl(initial?.external_url ?? "");
    setDescription(initial?.short_description ?? "");
  }, [open, initial]);

  const submit = async () => {
    if (!title.trim()) { toast.error("العنوان مطلوب"); return; }
    if (!url.trim()) { toast.error("الرابط مطلوب"); return; }
    try {
      // basic URL validation
      new URL(url.trim());
    } catch {
      toast.error("أدخل رابطًا صحيحًا يبدأ بـ https://");
      return;
    }
    await onSave({ title: title.trim(), external_url: url.trim(), short_description: description.trim() });
  };

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AppDialogContent className="sm:max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle>رابط خارجي</AppDialogTitle>
          <AppDialogDescription>أضف الرابط ومعلوماته ليظهر للطلاب داخل المحتوى.</AppDialogDescription>
        </AppDialogHeader>
        <div className="p-4 pt-2 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان الرابط</label>
            <AppInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مرجع إضافي" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الرابط (URL)</label>
            <AppInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">وصف / معلومات عن الرابط</label>
            <AppTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب ماذا يحتوي هذا الرابط أو لماذا يحتاجه الطالب" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="outline" onClick={onClose} disabled={saving}>إلغاء</AppButton>
            <AppButton variant="default" onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</AppButton>
          </div>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
