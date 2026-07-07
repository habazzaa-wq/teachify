"use client";

import { useState, useEffect, useCallback } from "react";
import { AppDrawer, AppDialogHeader, AppDialogTitle, AppDialogDescription, AppButton, AppInput, Label, AppSwitch, AppTextarea } from "@/components/ui";
import type { CreateCourseModulePayload } from "../types";

const INITIAL_FORM: CreateCourseModulePayload = {
  title: "",
  description: null,
  color: null,
  icon: null,
  notes: null,
  featured: false,
};

interface ModuleCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateCourseModulePayload) => void;
  saving?: boolean;
}

export function ModuleCreateDrawer({ open, onOpenChange, onSave, saving }: ModuleCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateCourseModulePayload>(INITIAL_FORM);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => setFormData(INITIAL_FORM));
    }
  }, [open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim()) return;
      onSave({
        ...formData,
        description: formData.description || null,
        color: formData.color || null,
        icon: formData.icon || null,
        notes: formData.notes || null,
      });
    },
    [formData, onSave],
  );

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} side="end">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <AppDialogHeader className="px-6 pt-6">
          <AppDialogTitle>إضافة وحدة جديدة</AppDialogTitle>
          <AppDialogDescription>أدخل معلومات الوحدة الجديدة</AppDialogDescription>
        </AppDialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-5 py-6">
          <div className="space-y-2">
            <Label>عنوان الوحدة</Label>
            <AppInput
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="أدخل عنوان الوحدة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <AppTextarea
              value={formData.description ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="وصف الوحدة (اختياري)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات داخلية</Label>
            <AppTextarea
              value={formData.notes ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="ملاحظات (اختياري)"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اللون</Label>
              <AppInput
                value={formData.color ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                placeholder="#ff0000"
              />
            </div>
            <div className="space-y-2">
              <Label>الأيقونة</Label>
              <AppInput
                value={formData.icon ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                placeholder="book-open"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>وحدة مميزة</Label>
            <AppSwitch
              checked={formData.featured ?? false}
              onCheckedChange={(checked) => setFormData((p) => ({ ...p, featured: checked }))}
            />
          </div>
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-end gap-3">
          <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </AppButton>
          <AppButton type="submit" loading={saving}>
            حفظ
          </AppButton>
        </div>
      </form>
    </AppDrawer>
  );
}
