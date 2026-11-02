"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  Label,
  AppTextarea,
} from "@/components/ui";
import { COURSE_NON_FILTER_VISIBILITY_OPTIONS, COURSE_NON_FILTER_DIFFICULTY_OPTIONS, COURSE_NON_FILTER_PRICING_OPTIONS, LANGUAGE_OPTIONS } from "../constants";
import type { CreateCoursePayload, CourseVisibility, CourseDifficulty, PricingType } from "../types";
import { CourseImageUploader } from "./CourseImageUploader";
import { useCourseTags } from "../hooks/useCourseTags";
import { useEducationalStagesList } from "@/features/homepage/educational-stages/hooks";
import { useSubjectsList } from "@/features/subjects/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";

const nonLangOptions = LANGUAGE_OPTIONS.filter((l) => l.value !== "all");
const REGIONAL_COUNTRIES = [
  { code: "SA", name: "السعودية", currency: "SR" },
  { code: "AE", name: "الإمارات", currency: "AED" },
  { code: "KW", name: "الكويت", currency: "KWD" },
  { code: "QA", name: "قطر", currency: "QAR" },
  { code: "BH", name: "البحرين", currency: "BHD" },
  { code: "US", name: "الولايات المتحدة", currency: "USD" },
];

const EMPTY_FORM: CreateCoursePayload = {
  title: "",
  subtitle: "",
  shortDescription: "",
  description: "",
  fullDescription: "",
  thumbnailPath: null,
  visibility: "private",
  difficulty: "beginner",
  language: "ar",
  pricingType: "free",
  price: 0,
  currency: "EGP",
  tagIds: [],
  requirements: [],
  learningOutcomes: [],
  targetAudience: [],
};

function StringListField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }, [draft, values, onChange]);

  const remove = useCallback(
    (idx: number) => onChange(values.filter((_, i) => i !== idx)),
    [values, onChange],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <AppInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <AppButton type="button" variant="outline" size="icon" onClick={add} aria-label="إضافة">
          <Plus className="h-4 w-4" />
        </AppButton>
      </div>
      {values.length > 0 && (
        <ul className="space-y-1.5">
          {values.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-sm"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CourseFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formKey: string;
  initialValues?: CreateCoursePayload | null;
  onSave?: (data: CreateCoursePayload) => void;
  saving?: boolean;
  footerNote?: string;
}

function CourseFormPanel({
  open,
  onOpenChange,
  title,
  formKey,
  initialValues,
  onSave,
  saving,
  footerNote,
}: CourseFormPanelProps) {
  const { data: tags = [] } = useCourseTags();
  const { data: stagesData } = useEducationalStagesList();
  const { data: subjectsData } = useSubjectsList();
  const { tenant } = useActiveTenant();
  const regionalPricingEnabled = tenant?.feature_flags?.has_regional_pricing === true;
  const stages = stagesData?.data ?? [];
  const subjects = subjectsData?.data ?? [];
  const [formData, setFormData] = useState<CreateCoursePayload>(EMPTY_FORM);

  useEffect(() => {
    setFormData(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [formKey, initialValues]);

  const updateField = useCallback(<K extends keyof CreateCoursePayload>(key: K, value: CreateCoursePayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateRegionalPrice = useCallback((countryCode: string, value: number | null) => {
    setFormData((previous) => {
      const regionalPrices = { ...(previous.regionalPrices ?? {}) };
      if (value === null || value <= 0) {
        delete regionalPrices[countryCode];
      } else {
        regionalPrices[countryCode] = value;
      }
      return { ...previous, regionalPrices };
    });
  }, []);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave({
      ...formData,
      regionalPrices: regionalPricingEnabled ? formData.regionalPrices ?? {} : undefined,
    });
  }, [onSave, formData, regionalPricingEnabled]);

  const isValid = formData.title.length > 0;

  if (!open) return null;

  return (
    <aside
      className="fixed inset-y-0 end-0 z-40 flex w-full flex-col border-s border-border/50 bg-background shadow-2xl sm:max-w-[440px] lg:max-w-[480px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
          <h2 className="text-lg font-semibold tracking-tight truncate">{title}</h2>
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
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              صورة الكورس
            </h3>
            <CourseImageUploader
              value={formData.thumbnailPath}
              onChange={(url) => updateField("thumbnailPath", url)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              المعلومات الأساسية
            </h3>
            <div className="space-y-2">
              <Label htmlFor="form-title">عنوان الدورة</Label>
              <AppInput
                id="form-title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="أدخل عنوان الدورة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-subtitle">العنوان الفرعي</Label>
              <AppInput
                id="form-subtitle"
                value={formData.subtitle ?? ""}
                onChange={(e) => updateField("subtitle", e.target.value)}
                placeholder="وصف قصير للدورة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-shortdesc">وصف مختصر</Label>
              <AppTextarea
                id="form-shortdesc"
                value={formData.shortDescription ?? ""}
                onChange={(e) => updateField("shortDescription", e.target.value)}
                placeholder="وصف مختصر للدورة (500 حرف)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">الوصف</Label>
              <AppTextarea
                id="form-description"
                value={formData.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="وصف الدورة"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-fulldesc">الوصف الكامل</Label>
              <AppTextarea
                id="form-fulldesc"
                value={formData.fullDescription ?? ""}
                onChange={(e) => updateField("fullDescription", e.target.value)}
                placeholder="تفاصيل الدورة الكاملة"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              الكلمات المفتاحية (التاجات)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="form-tags">التاجات</Label>
              <AppSelect
                value={formData.tagIds?.[0] != null ? String(formData.tagIds[0]) : ""}
                onValueChange={(val) => updateField("tagIds", val ? [Number(val)] : [])}
              >
                <AppSelectTrigger id="form-tags" className="h-9">
                  <AppSelectValue placeholder="اختر تاج" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="">بدون تاج</AppSelectItem>
                  {tags.map((tag) => (
                    <AppSelectItem key={tag.id} value={String(tag.id)}>
                      {tag.name}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              التصنيف
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form-stage">المرحلة الدراسية</Label>
                <AppSelect
                  value={formData.educationalStageId != null ? String(formData.educationalStageId) : ""}
                  onValueChange={(val) => updateField("educationalStageId", val ? Number(val) : null)}
                >
                  <AppSelectTrigger id="form-stage" className="h-9">
                    <AppSelectValue placeholder="اختر المرحلة الدراسية" />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value="">بدون مرحلة</AppSelectItem>
                    {stages.filter((s) => s.is_active).map((s) => (
                      <AppSelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-subject">المادة</Label>
                <AppSelect
                  value={formData.subjectId != null ? String(formData.subjectId) : ""}
                  onValueChange={(val) => updateField("subjectId", val ? Number(val) : null)}
                >
                  <AppSelectTrigger id="form-subject" className="h-9">
                    <AppSelectValue placeholder="اختر المادة" />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value="">بدون مادة</AppSelectItem>
                    {subjects.filter((s) => s.is_active).map((s) => (
                      <AppSelectItem key={s.id} value={String(s.id)}>
                        {s.name}
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
              الإعدادات
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form-visibility">الظهور</Label>
                <AppSelect
                  value={formData.visibility}
                  onValueChange={(val) => updateField("visibility", val as CourseVisibility)}
                >
                  <AppSelectTrigger id="form-visibility" className="h-9">
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
                <Label htmlFor="form-difficulty">المستوى</Label>
                <AppSelect
                  value={formData.difficulty}
                  onValueChange={(val) => updateField("difficulty", val as CourseDifficulty)}
                >
                  <AppSelectTrigger id="form-difficulty" className="h-9">
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
                <Label htmlFor="form-language">اللغة</Label>
                <AppSelect
                  value={formData.language}
                  onValueChange={(val) => updateField("language", val)}
                >
                  <AppSelectTrigger id="form-language" className="h-9">
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
                <Label htmlFor="form-pricing">نوع السعر</Label>
                <AppSelect
                  value={formData.pricingType}
                  onValueChange={(val) => updateField("pricingType", val as PricingType)}
                >
                  <AppSelectTrigger id="form-pricing" className="h-9">
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
                    <Label htmlFor="form-price">السعر</Label>
                    <AppInput
                      id="form-price"
                      type="number"
                      value={String(formData.price ?? "")}
                      onChange={(e) => updateField("price", e.target.value ? Number(e.target.value) : null)}
                      placeholder="0"
                    />
                  </div>
                  {regionalPricingEnabled ? (
                    <div className="space-y-2">
                      <Label>العملة الأساسية</Label>
                      <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                        جنيه مصري (EGP)
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="form-currency">العملة</Label>
                      <AppInput
                        id="form-currency"
                        value={formData.currency ?? "EGP"}
                        onChange={(e) => updateField("currency", e.target.value)}
                        placeholder="EGP"
                        maxLength={3}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {regionalPricingEnabled && formData.pricingType !== "free" && (
              <div className="space-y-3 rounded-xl border border-border/60 p-4">
                <div>
                  <h4 className="text-sm font-semibold">أسعار حسب الدولة</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    العملة محددة حسب الدولة. اترك السعر فارغاً لاستخدام السعر الأساسي بالجنيه المصري.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {REGIONAL_COUNTRIES.map((country) => (
                    <div className="space-y-1.5" key={country.code}>
                      <Label htmlFor={`regional-price-${country.code}`}>
                        {country.name} ({country.currency})
                      </Label>
                      <AppInput
                        id={`regional-price-${country.code}`}
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.regionalPrices?.[country.code] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateRegionalPrice(country.code, value ? Number(value) : null);
                        }}
                        placeholder="استخدم السعر الأساسي"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              تفاصيل إضافية
            </h3>
            <StringListField
              label="متطلبات الدورة"
              values={formData.requirements ?? []}
              onChange={(v) => updateField("requirements", v)}
              placeholder="أضف متطلباً"
            />
            <StringListField
              label="مخرجات التعلم"
              values={formData.learningOutcomes ?? []}
              onChange={(v) => updateField("learningOutcomes", v)}
              placeholder="أضف مخرجاً"
            />
            <StringListField
              label="الجمهور المستهدف"
              values={formData.targetAudience ?? []}
              onChange={(v) => updateField("targetAudience", v)}
              placeholder="أضف جمهوراً"
            />
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="text-xs text-muted-foreground">{footerNote}</div>
        <div className="flex items-center gap-3">
          <AppButton variant="ghost" onClick={handleClose} className="text-sm">
            إلغاء
          </AppButton>
          {onSave && (
            <AppButton
              size="default"
              onClick={handleSave}
              loading={saving}
              disabled={!isValid}
              className="text-sm min-w-[100px]"
            >
              <Save className="h-4 w-4" />
              حفظ
            </AppButton>
          )}
        </div>
      </footer>
    </aside>
  );
}

export { CourseFormPanel, EMPTY_FORM };
export type { CourseFormPanelProps };
