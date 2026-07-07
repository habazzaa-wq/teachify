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
  Skeleton,
} from "@/components/ui";
import { COURSE_NON_FILTER_VISIBILITY_OPTIONS, COURSE_NON_FILTER_DIFFICULTY_OPTIONS, COURSE_NON_FILTER_PRICING_OPTIONS, LANGUAGE_OPTIONS } from "../constants";
import { useCourse } from "../hooks";
import type { UpdateCoursePayload, CourseVisibility, CourseDifficulty, PricingType } from "../types";

interface CourseEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  onSave?: (id: string, data: UpdateCoursePayload) => void;
  saving?: boolean;
  categories?: Array<{ id: string; name: string }>;
}

const nonLangOptions = LANGUAGE_OPTIONS.filter((l) => l.value !== "all");

function CourseEditDrawer({
  open,
  onOpenChange,
  courseId,
  onSave,
  saving,
  categories = [],
}: CourseEditDrawerProps) {
  const { data: course, isLoading } = useCourse(courseId);
  const [formData, setFormData] = useState<UpdateCoursePayload>({});

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        subtitle: course.subtitle ?? "",
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        fullDescription: course.fullDescription ?? "",
        visibility: course.visibility,
        difficulty: course.difficulty,
        language: course.language,
        duration: course.duration,
        pricingType: course.pricingType,
        price: course.price,
        currency: course.currency,
        discountPrice: course.discountPrice,
        enrollmentLimit: course.enrollmentLimit,
        startDate: course.startDate,
        endDate: course.endDate,
        certificateEnabled: course.certificateEnabled,
        featured: course.featured,
        seoTitle: course.seo.title ?? "",
        seoDescription: course.seo.description ?? "",
        seoKeywords: course.seo.keywords ?? "",
        categoryIds: course.category ? [Number(course.category.id)] : [],
        requirements: course.requirements,
        learningOutcomes: course.learningOutcomes,
        targetAudience: course.targetAudience,
      });
    }
  }, [course]);

  const updateField = useCallback(<K extends keyof UpdateCoursePayload>(key: K, value: UpdateCoursePayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave || !courseId) return;
    onSave(courseId, formData);
  }, [onSave, courseId, formData]);

  const isValid = formData.title && formData.title.length > 0;

  if (isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[600px] lg:max-w-[700px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="تعديل الدورة">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              تعديل الدورة
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

        <div className="shrink-0 border-b bg-muted/20 px-6 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{course?.title}</span>
        </div>

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
                <Label htmlFor="edit-title">عنوان الدورة</Label>
                <AppInput
                  id="edit-title"
                  value={formData.title ?? ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="أدخل عنوان الدورة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subtitle">العنوان الفرعي</Label>
                <AppInput
                  id="edit-subtitle"
                  value={formData.subtitle ?? ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="وصف قصير للدورة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-shortdesc">وصف مختصر</Label>
                <AppTextarea
                  id="edit-shortdesc"
                  value={formData.shortDescription ?? ""}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  placeholder="وصف مختصر للدورة"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <AppTextarea
                  id="edit-description"
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
                  <Label htmlFor="edit-visibility">الظهور</Label>
                  <AppSelect
                    value={formData.visibility ?? "private"}
                    onValueChange={(val) => updateField("visibility", val as CourseVisibility)}
                  >
                    <AppSelectTrigger id="edit-visibility" className="h-9">
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
                  <Label htmlFor="edit-difficulty">المستوى</Label>
                  <AppSelect
                    value={formData.difficulty ?? "beginner"}
                    onValueChange={(val) => updateField("difficulty", val as CourseDifficulty)}
                  >
                    <AppSelectTrigger id="edit-difficulty" className="h-9">
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
                  <Label htmlFor="edit-language">اللغة</Label>
                  <AppSelect
                    value={formData.language ?? "ar"}
                    onValueChange={(val) => updateField("language", val)}
                  >
                    <AppSelectTrigger id="edit-language" className="h-9">
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
                  <Label htmlFor="edit-pricing">نوع السعر</Label>
                  <AppSelect
                    value={formData.pricingType ?? "free"}
                    onValueChange={(val) => updateField("pricingType", val as PricingType)}
                  >
                    <AppSelectTrigger id="edit-pricing" className="h-9">
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
                <div className="space-y-2">
                  <Label htmlFor="edit-category">التصنيف</Label>
                  <AppSelect
                    value={formData.categoryIds?.[0] != null ? String(formData.categoryIds[0]) : ""}
                    onValueChange={(val) => updateField("categoryIds", val ? [Number(val)] : [])}
                  >
                    <AppSelectTrigger id="edit-category" className="h-9">
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
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                خيارات إضافية
              </h3>
              <div className="flex items-center gap-3">
                <AppSwitch
                  id="edit-certificate"
                  checked={formData.certificateEnabled ?? false}
                  onCheckedChange={(val) => updateField("certificateEnabled", val)}
                />
                <Label htmlFor="edit-certificate">تمكين الشهادات</Label>
              </div>
              <div className="flex items-center gap-3">
                <AppSwitch
                  id="edit-featured"
                  checked={formData.featured ?? false}
                  onCheckedChange={(val) => updateField("featured", val)}
                />
                <Label htmlFor="edit-featured">دورة مميزة</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                تحسين محركات البحث (SEO)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="edit-seo-title">العنوان لتحسين SEO</Label>
                <AppInput
                  id="edit-seo-title"
                  value={formData.seoTitle ?? ""}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  placeholder="عنوان محسّن لمحركات البحث"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-seo-desc">الوصف لتحسين SEO</Label>
                <AppTextarea
                  id="edit-seo-desc"
                  value={formData.seoDescription ?? ""}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  placeholder="وصف محسّن لمحركات البحث"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-seo-keywords">الكلمات المفتاحية</Label>
                <AppInput
                  id="edit-seo-keywords"
                  value={formData.seoKeywords ?? ""}
                  onChange={(e) => updateField("seoKeywords", e.target.value)}
                  placeholder="كلمات مفتاحية مفصولة بفواصل"
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            آخر تحديث: {course?.updatedAt ? new Date(course.updatedAt).toLocaleDateString("ar") : "—"}
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

export { CourseEditDrawer };
