"use client";

import { useState, useCallback } from "react";
import { X, Save } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppDrawer,
  AppTextarea,
  Label,
  AppSwitch,
} from "@/components/ui";
import type { CreateCourseSectionPayload } from "../types";

interface SectionCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateCourseSectionPayload) => void;
  saving?: boolean;
}

function SectionCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
}: SectionCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateCourseSectionPayload>({
    title: "",
    description: "",
    duration_minutes: null,
    free_preview: false,
    locked: false,
    featured: false,
    color: null,
    icon: null,
    notes: null,
  });

  const updateField = useCallback(<K extends keyof CreateCourseSectionPayload>(key: K, value: CreateCourseSectionPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formData);
  }, [onSave, formData]);

  const isValid = formData.title.length > 0;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة قسم جديد">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة قسم جديد
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                المعلومات الأساسية
              </h3>
              <div className="space-y-2">
                <Label htmlFor="create-title">عنوان القسم</Label>
                <AppInput
                  id="create-title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="أدخل عنوان القسم"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">الوصف</Label>
                <AppTextarea
                  id="create-description"
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="وصف القسم"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-notes">ملاحظات</Label>
                <AppTextarea
                  id="create-notes"
                  value={formData.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="ملاحظات داخلية"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                الإعدادات
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-duration">المدة (بالدقائق)</Label>
                  <AppInput
                    id="create-duration"
                    type="number"
                    value={formData.duration_minutes ?? ""}
                    onChange={(e) => updateField("duration_minutes", e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-color">اللون</Label>
                  <AppInput
                    id="create-color"
                    value={formData.color ?? ""}
                    onChange={(e) => updateField("color", e.target.value || null)}
                    placeholder="#3B82F6"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-icon">الأيقونة</Label>
                  <AppInput
                    id="create-icon"
                    value={formData.icon ?? ""}
                    onChange={(e) => updateField("icon", e.target.value || null)}
                    placeholder="book-open"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-free_preview">معاينة مجانية</Label>
                  <AppSwitch
                    id="create-free_preview"
                    checked={formData.free_preview ?? false}
                    onCheckedChange={(checked) => updateField("free_preview", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-locked">مقفل</Label>
                  <AppSwitch
                    id="create-locked"
                    checked={formData.locked ?? false}
                    onCheckedChange={(checked) => updateField("locked", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-featured">مميز</Label>
                  <AppSwitch
                    id="create-featured"
                    checked={formData.featured ?? false}
                    onCheckedChange={(checked) => updateField("featured", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t px-6 py-4 shrink-0 bg-background">
          <div className="flex items-center justify-end gap-3">
            <AppButton variant="outline" onClick={handleClose} disabled={saving}>
              إلغاء
            </AppButton>
            <AppButton onClick={handleSave} loading={saving} disabled={!isValid}>
              <Save className="h-4 w-4" />
              حفظ
            </AppButton>
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { SectionCreateDrawer };
