"use client";

import { useState, useCallback, useEffect } from "react";
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
import { LESSON_TYPE_OPTIONS, VISIBILITY_OPTIONS } from "../constants";
import type { Lesson, UpdateLessonPayload, LessonType, LessonVisibility } from "../types";

interface LessonEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave?: (data: UpdateLessonPayload) => void;
  saving?: boolean;
}

function LessonEditDrawer({
  open,
  onOpenChange,
  lesson,
  onSave,
  saving,
}: LessonEditDrawerProps) {
  const [formData, setFormData] = useState<UpdateLessonPayload>({
    title: "",
    short_description: "",
    description: "",
    lesson_type: "video",
    visibility: "private",
    duration_seconds: null,
    estimated_duration: null,
    free_preview: false,
    downloadable: false,
    featured: false,
    comments_enabled: true,
    notes: "",
    color: null,
    icon: null,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        short_description: lesson.shortDescription ?? "",
        description: lesson.description ?? "",
        lesson_type: lesson.lessonType,
        visibility: lesson.visibility,
        duration_seconds: lesson.durationSeconds,
        estimated_duration: lesson.estimatedDuration,
        free_preview: lesson.freePreview,
        downloadable: lesson.downloadable,
        featured: lesson.featured,
        comments_enabled: lesson.commentsEnabled,
        notes: lesson.notes ?? "",
        color: lesson.color,
        icon: lesson.icon,
      });
    }
  }, [lesson]);

  const updateField = useCallback(<K extends keyof UpdateLessonPayload>(key: K, value: UpdateLessonPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave || !lesson) return;
    onSave(formData);
  }, [onSave, lesson, formData]);

  const isValid = formData.title && formData.title.length > 0;

  if (!lesson) return null;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="تعديل الدرس">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              تعديل الدرس
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
                <Label htmlFor="edit-title">عنوان الدرس</Label>
                <AppInput
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="أدخل عنوان الدرس"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-short_description">وصف قصير</Label>
                <AppInput
                  id="edit-short_description"
                  value={formData.short_description ?? ""}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  placeholder="وصف مختصر للدرس"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <AppTextarea
                  id="edit-description"
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="وصف الدرس"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                النوع والإعدادات
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-lesson_type">نوع الدرس</Label>
                  <AppSelect
                    value={formData.lesson_type ?? "video"}
                    onValueChange={(val) => updateField("lesson_type", val as LessonType)}
                  >
                    <AppSelectTrigger id="edit-lesson_type" className="h-9">
                      <AppSelectValue placeholder="اختر النوع" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {LESSON_TYPE_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-visibility">الرؤية</Label>
                  <AppSelect
                    value={formData.visibility ?? "private"}
                    onValueChange={(val) => updateField("visibility", val as LessonVisibility)}
                  >
                    <AppSelectTrigger id="edit-visibility" className="h-9">
                      <AppSelectValue placeholder="اختر الرؤية" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {VISIBILITY_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">المدة (بالثواني)</Label>
                  <AppInput
                    id="edit-duration"
                    type="number"
                    value={formData.duration_seconds ?? ""}
                    onChange={(e) => updateField("duration_seconds", e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-estimated_duration">المدة التقديرية (بالدقائق)</Label>
                  <AppInput
                    id="edit-estimated_duration"
                    type="number"
                    value={formData.estimated_duration ?? ""}
                    onChange={(e) => updateField("estimated_duration", e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">اللون</Label>
                  <AppInput
                    id="edit-color"
                    value={formData.color ?? ""}
                    onChange={(e) => updateField("color", e.target.value || null)}
                    placeholder="#3B82F6"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">الأيقونة</Label>
                  <AppInput
                    id="edit-icon"
                    value={formData.icon ?? ""}
                    onChange={(e) => updateField("icon", e.target.value || null)}
                    placeholder="video"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-free_preview">معاينة مجانية</Label>
                  <AppSwitch
                    id="edit-free_preview"
                    checked={formData.free_preview ?? false}
                    onCheckedChange={(checked) => updateField("free_preview", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-downloadable">قابل للتحميل</Label>
                  <AppSwitch
                    id="edit-downloadable"
                    checked={formData.downloadable ?? false}
                    onCheckedChange={(checked) => updateField("downloadable", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-featured">مميز</Label>
                  <AppSwitch
                    id="edit-featured"
                    checked={formData.featured ?? false}
                    onCheckedChange={(checked) => updateField("featured", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-comments_enabled">تفعيل التعليقات</Label>
                  <AppSwitch
                    id="edit-comments_enabled"
                    checked={formData.comments_enabled ?? true}
                    onCheckedChange={(checked) => updateField("comments_enabled", checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ملاحظات داخلية
              </h3>
              <div className="space-y-2">
                <AppTextarea
                  id="edit-notes"
                  value={formData.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="ملاحظات داخلية (لن تظهر للطلاب)"
                  rows={2}
                />
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
              حفظ التغييرات
            </AppButton>
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { LessonEditDrawer };
