"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Award } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppDivider,
  AppButton,
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardDescription,
  AppCardContent,
  AppInput,
  AppTextarea,
  AppSwitch,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
  AppLoadingState,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import { useWhyChooseUsSettings, useUpdateWhyChooseUsSettings } from "@/features/homepage/why-choose-us/hooks";
import {
  DEFAULT_WHY_CHOOSE_US,
  ILL_OPTIONS,
  type WhyChooseUsIll,
  type WhyChooseUsSettings,
} from "@/features/homepage/why-choose-us/types";
import { WhyChooseUsOrbit } from "@/components/home/WhyChooseUsOrbit";

export default function HomepageWhyChooseUsPage() {
  const { data, isLoading } = useWhyChooseUsSettings();
  const updateWcu = useUpdateWhyChooseUsSettings();
  const [form, setForm] = useState<WhyChooseUsSettings>(DEFAULT_WHY_CHOOSE_US);

  useEffect(() => {
    if (data) {
      setForm({
        ...DEFAULT_WHY_CHOOSE_US,
        ...data,
        features:
          data.features && data.features.length
            ? data.features
            : DEFAULT_WHY_CHOOSE_US.features,
      });
    }
  }, [data]);

  const saving = updateWcu.isPending;

  const updateFeature = (i: number, patch: Partial<WhyChooseUsSettings["features"][number]>) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    }));
  };
  const removeFeature = (i: number) => {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));
  };
  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, { title: "", desc: "", ill: "cap" }],
    }));
  };
  const moveFeature = (i: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.features];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[j]!;
      next[j] = next[i]!;
      next[i] = tmp;
      return { ...prev, features: next };
    });
  };

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="لماذا تختارنا؟"
        description="إدارة قسم مزايا المنصة في الصفحة الرئيسية (المنظومة)"
      />
      <AppDivider className="mb-6" />

      <AppTabs defaultValue="content">
        <AppTabsList>
          <AppTabsTrigger value="content">المحتوى</AppTabsTrigger>
          <AppTabsTrigger value="preview">معاينة حية</AppTabsTrigger>
        </AppTabsList>

        {/* Content tab */}
        <AppTabsContent value="content">
          {isLoading ? (
            <AppLoadingState />
          ) : (
            <div className="space-y-6">
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>العنوان والوصف</AppCardTitle>
                  <AppCardDescription>
                    النص الذي يظهر أعلى قسم «لماذا تختارنا»
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      عنوان القسم <span className="text-destructive">*</span>
                    </label>
                    <AppInput
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="لماذا تختارنا؟"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">الوصف الفرعي</label>
                    <AppTextarea
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="وصف مختصر يظهر تحت العنوان"
                      rows={2}
                    />
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div>
                      <span className="text-sm font-medium">تفعيل القسم</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        إظهار قسم «لماذا تختارنا» في الصفحة الرئيسية
                      </p>
                    </div>
                    <AppSwitch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    />
                  </label>
                </AppCardContent>
              </AppCard>

              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>المزايا</AppCardTitle>
                  <AppCardDescription>
                    كل ميزة تظهر كعقدة في المنظومة. رتّبها وأضف أو احذف كما تشاء
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  {form.features.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-medium">ميزة {i + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AppButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i === 0}
                            onClick={() => moveFeature(i, -1)}
                            aria-label="تحريك للأعلى"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </AppButton>
                          <AppButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i === form.features.length - 1}
                            onClick={() => moveFeature(i, 1)}
                            aria-label="تحريك للأسفل"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </AppButton>
                          <AppButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFeature(i)}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </AppButton>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium">العنوان</label>
                          <AppInput
                            value={f.title}
                            onChange={(e) => updateFeature(i, { title: e.target.value })}
                            placeholder="عنوان الميزة"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium">الوصف</label>
                          <AppTextarea
                            value={f.desc}
                            onChange={(e) => updateFeature(i, { desc: e.target.value })}
                            placeholder="وصف مختصر للميزة"
                            rows={2}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium">الأيقونة</label>
                          <AppSelect
                            value={f.ill}
                            onValueChange={(v) => updateFeature(i, { ill: v as WhyChooseUsIll })}
                          >
                            <AppSelectTrigger>
                              <AppSelectValue placeholder="اختر الأيقونة" />
                            </AppSelectTrigger>
                            <AppSelectContent>
                              {ILL_OPTIONS.map((opt) => (
                                <AppSelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </AppSelectItem>
                              ))}
                            </AppSelectContent>
                          </AppSelect>
                        </div>
                      </div>
                    </div>
                  ))}

                  <AppButton variant="outline" className="w-full" onClick={addFeature}>
                    <Plus className="me-2 h-4 w-4" /> إضافة ميزة
                  </AppButton>
                </AppCardContent>
              </AppCard>

              <div className="flex justify-end">
                <AppButton
                  onClick={() => updateWcu.mutate(form)}
                  loading={saving}
                  disabled={!form.title.trim()}
                >
                  حفظ الإعدادات
                </AppButton>
              </div>
            </div>
          )}
        </AppTabsContent>

        {/* Preview tab */}
        <AppTabsContent value="preview">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> معاينة حية
              </AppCardTitle>
              <AppCardDescription>
                هكذا سيظهر قسم «لماذا تختارنا» في الصفحة الرئيسية
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <WhyChooseUsOrbit settings={form} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                المعاينة تعرض التعديلات الحالية. احفظ من تبويب «المحتوى» لتطبيقها على الموقع.
              </p>
            </AppCardContent>
          </AppCard>
        </AppTabsContent>
      </AppTabs>
    </AppPage>
  );
}
