"use client";

import { useState } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
  AppInput,
  Label,
} from "@/components/ui";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  saving?: boolean;
}

function CreateFolderDialog({ open, onOpenChange, onSave, saving }: CreateFolderDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>إنشاء مجلد جديد</AppDialogTitle>
        </AppDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المجلد</Label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم المجلد"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); setName(""); }}
            >
              إلغاء
            </AppButton>
            <AppButton type="submit" loading={saving} disabled={!name.trim()}>
              إنشاء
            </AppButton>
          </div>
        </form>
      </AppDialogContent>
    </AppDialog>
  );
}

export { CreateFolderDialog };
