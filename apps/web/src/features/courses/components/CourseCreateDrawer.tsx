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
import { COURSE_NON_FILTER_VISIBILITY_OPTIONS, COURSE_NON_FILTER_DIFFICULTY_OPTIONS, COURSE_NON_FILTER_PRICING_OPTIONS, LANGUAGE_OPTIONS } from "../constants";
import type { CreateCoursePayload, CourseVisibility, CourseDifficulty, PricingType } from "../types";

interface CourseCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateCoursePayload) => void;
  saving?: boolean;
  categories?: Array<{ id: string; name: string }>;
}

const nonLangOptions = LANGUAGE_OPTIONS.filter((l) => l.value !== "all");

function CourseCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
  categories = [],
}: CourseCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateCoursePayload>({
    title: "",
    subtitle: "",
    shortDescription: "",
    description: "",
    fullDescription: "",
    visibility: "private",
    difficulty: "beginner",
    language: "ar",
    pricingType: "free",
    price: 0,
    currency: "SAR",
    certificateEnabled: false,
    categoryIds: [],
    requirements: [],
    learningOutcomes: [],
    targetAudience: [],
  });

  const updateField = useCallback(<K extends keyof CreateCoursePayload>(key: K, value: CreateCoursePayload[K]) => {
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
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة دورة جديدة">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة دورة جديدة
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
                <Label htmlFor="create-title">عنوان الدورة</Label>
                <AppInput
                  id="create-title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="أدخل عنوان الدورة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-subtitle">العنوان الفرعي</Label>
                <AppInput
                  id="create-subtitle"
                  value={formData.subtitle ?? ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="وصف قصير للدورة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-shortdesc">وصف مختصر</Label>
                <AppTextarea
                  id="create-shortdesc"
                  value={formData.shortDescription ?? ""}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  placeholder="وصف مختصر للدورة (500 حرف)"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">الوصف</Label>
                <AppTextarea
                  id="create-description"
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="وصف الدورة"
                  rows={4}
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
                  <Label htmlFor="create-visibility">الظهور</Label>
                  <AppSelect
                    value={formData.visibility}
                    onValueChange={(val) => updateField("visibility", val as CourseVisibility)}
                  >
                    <AppSelectTrigger id="create-visibility" className="h-9">
                      <AppSelectValue placeholder="اختر الظهور" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {COURSE_NON_FILTER_VISIBILITY_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-difficulty">المستوى</Label>
                  <AppSelect
                    value={formData.difficulty}
                    onValueChange={(val) => updateField("difficulty", val as CourseDifficulty)}
                  >
                    <AppSelectTrigger id="create-difficulty" className="h-9">
                      <AppSelectValue placeholder="اختر المستوى" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {COURSE_NON_FILTER_DIFFICULTY_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-language">اللغة</Label>
                  <AppSelect
                    value={formData.language}
                    onValueChange={(val) => updateField("language", val)}
                  >
                    <AppSelectTrigger id="create-language" className="h-9">
                      <AppSelectValue placeholder="اختر اللغة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {nonLangOptions.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-pricing">نوع السعر</Label>
                  <AppSelect
                    value={formData.pricingType}
                    onValueChange={(val) => updateField("pricingType", val as PricingType)}
                  >
                    <AppSelectTrigger id="create-pricing" className="h-9">
                      <AppSelectValue placeholder="اختر نوع السعر" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {COURSE_NON_FILTER_PRICING_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                {formData.pricingType !== "free" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="create-price">السعر</Label>
                      <AppInput
                        id="create-price"
                        type="number"
                        value={String(formData.price ?? "")}
                        onChange={(e) => updateField("price", e.target.value ? Number(e.target.value) : null)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-currency">العملة</Label>
                      <AppInput
                        id="create-currency"
                        value={formData.currency ?? "SAR"}
                        onChange={(e) => updateField("currency", e.target.value)}
                        placeholder="SAR"
                        maxLength={3}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="create-duration">المدة (بالدقائق)</Label>
                  <AppInput
                    id="create-duration"
                    type="number"
                    value={String(formData.duration ?? "")}
                    onChange={(e) => updateField("duration", e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                خيارات إضافية
              </h3>
                <div className="space-y-2">
                  <Label htmlFor="create-category">التصنيف</Label>
                  <AppSelect
                    value={formData.categoryIds?.[0] != null ? String(formData.categoryIds[0]) : ""}
                    onValueChange={(val) => updateField("categoryIds", val ? [Number(val)] : [])}
                  >
                    <AppSelectTrigger id="create-category" className="h-9">
                      <AppSelectValue placeholder="اختر التصنيف" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      <AppSelectItem value="">بدون تصنيف</AppSelectItem>
                      {categories.map((cat) => (
                        <AppSelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="flex items-center gap-3">
                  <AppSwitch
                    id="create-certificate"
                    checked={formData.certificateEnabled ?? false}
                    onCheckedChange={(val) => updateField("certificateEnabled", val)}
                  />
                  <Label htmlFor="create-certificate">تمكين الشهادات</Label>
                </div>
              </div>
            </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إنشاء الدورة كمسودة
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="ghost" onClick={handleClose} className="text-sm">
              إلغاء
            </AppButton>
            {onSave && (
              <AppButton size="default" onClick={handleSave} loading={saving} disabled={!isValid} className="text-sm min-w-[100px]">
                <Save className="h-4 w-4" />
                حفظ
              </AppButton>
            )}
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { CourseCreateDrawer };
