"use client";

import { useState, useEffect, useRef } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
  AppInput,
  Label,
} from "@/components/ui";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string) => void;
  currentTitle?: string | null;
  saving?: boolean;
}

function RenameDialog({ open, onOpenChange, onSave, currentTitle, saving }: RenameDialogProps) {
  const [title, setTitle] = useState("");
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTitle(currentTitle ?? "");
    }
    wasOpen.current = open;
  }, [open, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim());
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>إعادة تسمية</AppDialogTitle>
        </AppDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم الجديد</Label>
            <AppInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل الاسم الجديد"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </AppButton>
            <AppButton type="submit" loading={saving} disabled={!title.trim()}>
              حفظ
            </AppButton>
          </div>
        </form>
      </AppDialogContent>
    </AppDialog>
  );
}

export { RenameDialog };
