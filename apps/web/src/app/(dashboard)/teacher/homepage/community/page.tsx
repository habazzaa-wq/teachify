"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Eye,
  LayoutGrid,
  CheckCircle2,
} from "lucide-react";
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
import {
  COMMUNITY_DESIGNS,
  COMMUNITY_ICON_OPTIONS,
  DEFAULT_COMMUNITY_SECTION,
  createFeature,
  mergeCommunitySettings,
  type CommunityFeature,
  type CommunitySectionSettings,
} from "@/features/homepage/community/types";
import {
  useCommunitySectionSettings,
  useUpdateCommunitySectionSettings,
} from "@/features/homepage/community/hooks";
import { DesignMiniPreview } from "@/features/homepage/community/components/DesignMiniPreview";
import { CommunitySectionRenderer } from "@/features/homepage/community/components/CommunitySectionRenderer";
import { PRIMARY } from "@/features/homepage/community/components/shared";

type TabKey = "designs" | "settings" | "preview";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <AppSwitch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export default function CommunitySectionPage() {
  const { data, isLoading } = useCommunitySectionSettings();
  const update = useUpdateCommunitySectionSettings();
  const [form, setForm] = useState<CommunitySectionSettings>(DEFAULT_COMMUNITY_SECTION);
  const [tab, setTab] = useState<TabKey>("designs");

  useEffect(() => {
    // Sync server settings into the local editable form once they load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (data) setForm(mergeCommunitySettings(data));
  }, [data]);

  const saving = update.isPending;

  const set = <K extends keyof CommunitySectionSettings>(
    key: K,
    value: CommunitySectionSettings[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const updateFeatures = (updater: (prev: CommunityFeature[]) => CommunityFeature[]) =>
    setForm((f) => ({ ...f, features: updater(f.features) }));

  const updateTicker = (updater: (prev: string[]) => string[]) =>
    setForm((f) => ({
      ...f,
      minimal: { ...f.minimal, tickerItems: updater(f.minimal.tickerItems) },
    }));

  const selectedDesign = useMemo(
    () => COMMUNITY_DESIGNS.find((d) => d.id === form.design)!,
    [form.design],
  );

  const save = () => update.mutate(form);

  if (isLoading) {
    return (
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="سكشن منتدى الطلاب"
          description="إدارة قسم منتدى الطلاب في الصفحة الرئيسية"
        />
        <AppDivider className="mb-6" />
        <AppLoadingState />
      </AppPage>
    );
  }

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="سكشن منتدى الطلاب"
        description="اختر تصميماً واحترافياً وعدّل كل محتواه ديناميكياً — يظهر في الصفحة الرئيسية"
      />
      <AppDivider className="mb-6" />

      <AppTabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
          <AppTabsList>
            <AppTabsTrigger value="designs">التصاميم</AppTabsTrigger>
            <AppTabsTrigger value="settings">الإعدادات والمحتوى</AppTabsTrigger>
            <AppTabsTrigger value="preview">معاينة حية</AppTabsTrigger>
          </AppTabsList>
          <div className="flex items-center gap-2">
            {form.design !== "classic" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                تم اختيار: {selectedDesign.name}
              </span>
            )}
            <AppButton onClick={save} loading={saving} disabled={saving}>
              حفظ الإعدادات
            </AppButton>
          </div>
        </div>

        {/* ───────────────── Designs tab ───────────────── */}
        <AppTabsContent value="designs">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_DESIGNS.map((design) => {
              const active = form.design === design.id;
              return (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => {
                    set("design", design.id);
                    setTab("settings");
                  }}
                  className={`group relative overflow-hidden rounded-2xl border-2 text-right transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    active
                      ? "border-[var(--brand-primary)] shadow-lg"
                      : "border-border hover:border-[var(--brand-primary)]/50"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-white shadow"
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                  <DesignMiniPreview id={design.id} />
                  <div className="bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <LayoutGrid className="h-4 w-4" style={{ color: PRIMARY }} />
                      {design.name}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {design.description}
                    </p>
                    <span
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-colors"
                      style={{ backgroundColor: active ? "var(--brand-primary)" : "#94a3b8" }}
                    >
                      {active ? "التصميم المُفعّل" : "اختيار هذا التصميم"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            اختر تصميماً لفتح إعداداته ومحتوياته القابلة للتعديل. كل التصاميم تعرض
            الإحصائيات الحية للمنتدى والنشاط الأخير تلقائياً، بينما كل النصوص
            والمميزات والعناوين قابلة للتخصيص بالكامل من لوحة التحكم.
          </p>
        </AppTabsContent>

        {/* ───────────────── Settings tab ───────────────── */}
        <AppTabsContent value="settings">
          <div className="space-y-6">
            {/* Activation */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>التصميم المُختار</AppCardTitle>
                <AppCardDescription>
                  {selectedDesign.name} — {selectedDesign.description}
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <SwitchRow
                  label="تفعيل السكشن في الصفحة الرئيسية"
                  description="إظهار قسم منتدى الطلاب للزوار"
                  checked={form.isActive}
                  onChange={(v) => set("isActive", v)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {COMMUNITY_DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => set("design", d.id)}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                        form.design === d.id
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                          : "border-border hover:border-[var(--brand-primary)]/40"
                      }`}
                    >
                      {d.name}
                      {form.design === d.id && (
                        <CheckCircle2 className="h-4 w-4" style={{ color: PRIMARY }} />
                      )}
                    </button>
                  ))}
                </div>
              </AppCardContent>
            </AppCard>

            {/* Headings */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>العناوين والنصوص</AppCardTitle>
                <AppCardDescription>المحتوى النصي الأساسي للسكشن</AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <Field label="شارة السكشن (البادجة)">
                  <AppInput
                    value={form.badgeText}
                    onChange={(e) => set("badgeText", e.target.value)}
                    placeholder="منتدى الطلاب"
                  />
                </Field>
                <Field label="العنوان — السطر الأول">
                  <AppInput
                    value={form.titleTop}
                    onChange={(e) => set("titleTop", e.target.value)}
                    placeholder="مكان يجتمع فيه الطلاب"
                  />
                </Field>
                <Field label="العنوان — السطر الثاني">
                  <AppInput
                    value={form.titleBottom}
                    onChange={(e) => set("titleBottom", e.target.value)}
                    placeholder="للمناقشة وتبادل المعرفة"
                  />
                </Field>
                <Field label="الوصف">
                  <AppTextarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="اطرح أسئلتك، شارك حلولك..."
                  />
                </Field>
              </AppCardContent>
            </AppCard>

            {/* CTAs */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>أزرار العمل (Call To Action)</AppCardTitle>
                <AppCardDescription>
                  يوجّه الزر الرئيسي الزائر لدخول المنتدى، وزر ثانوي للقنوات
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <Field label="نص الزر الرئيسي">
                  <AppInput
                    value={form.primaryCta.label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        primaryCta: { ...f.primaryCta, label: e.target.value },
                      }))
                    }
                    placeholder="ادخل المنتدى الآن"
                  />
                </Field>
                <SwitchRow
                  label="إظهار الزر الرئيسي"
                  checked={form.primaryCta.visible}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      primaryCta: { ...f.primaryCta, visible: v },
                    }))
                  }
                />
                <Field label="نص الزر الثانوي">
                  <AppInput
                    value={form.secondaryCta.label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        secondaryCta: { ...f.secondaryCta, label: e.target.value },
                      }))
                    }
                    placeholder="تعرّف على القنوات"
                  />
                </Field>
                <SwitchRow
                  label="إظهار الزر الثانوي"
                  checked={form.secondaryCta.visible}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      secondaryCta: { ...f.secondaryCta, visible: v },
                    }))
                  }
                />
                <Field label="نص صغير تحت الأزرار (اختياري)">
                  <AppInput
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="سجّل دخولك للانضمام إلى النقاشات"
                  />
                </Field>
              </AppCardContent>
            </AppCard>

            {/* Stats */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>الإحصائيات الحية</AppCardTitle>
                <AppCardDescription>
                  الأرقام تُجلب تلقائياً من المنتدى — يمكنك تعديل التسميات فقط
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <SwitchRow
                  label="إظهار الإحصائيات"
                  checked={form.showStats}
                  onChange={(v) => set("showStats", v)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="تسمية الأعضاء">
                    <AppInput
                      value={form.statLabels.members}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          statLabels: { ...f.statLabels, members: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="تسمية المتصلين">
                    <AppInput
                      value={form.statLabels.online}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          statLabels: { ...f.statLabels, online: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="تسمية مناقشات اليوم">
                    <AppInput
                      value={form.statLabels.today}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          statLabels: { ...f.statLabels, today: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="تسمية الموضوعات">
                    <AppInput
                      value={form.statLabels.threads}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          statLabels: { ...f.statLabels, threads: e.target.value },
                        }))
                      }
                    />
                  </Field>
                </div>
              </AppCardContent>
            </AppCard>

            {/* Activity */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>بطاقة آخر نشاط</AppCardTitle>
                <AppCardDescription>
                  تعرض آخر رسالة فعلية في المنتدى — عدّل تسمية البطاقة فقط
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <SwitchRow
                  label="إظهار بطاقة آخر نشاط"
                  checked={form.showActivity}
                  onChange={(v) => set("showActivity", v)}
                />
                <Field label="تسمية بطاقة آخر نشاط">
                  <AppInput
                    value={form.activityLabel}
                    onChange={(e) => set("activityLabel", e.target.value)}
                    placeholder="آخر نشاط في المنتدى"
                  />
                </Field>
              </AppCardContent>
            </AppCard>

            {/* Features */}
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>المميزات والقنوات</AppCardTitle>
                <AppCardDescription>
                  حتى 6 مميزات تظهر في التصميم المختار (العنوان + الوصف + الأيقونة)
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                {form.features.map((feature, idx) => (
                  <div
                    key={feature.id}
                    className="rounded-2xl border border-border bg-muted/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        المميزة {idx + 1}
                      </span>
                      <AppButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          updateFeatures((prev) =>
                            prev.filter((f) => f.id !== feature.id),
                          )
                        }
                        disabled={form.features.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </AppButton>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_1fr]">
                      <Field label="الأيقونة">
                        <AppSelect
                          value={feature.icon}
                          onValueChange={(v) =>
                            updateFeatures((prev) =>
                              prev.map((f) =>
                                f.id === feature.id
                                  ? { ...f, icon: v as CommunityFeature["icon"] }
                                  : f,
                              ),
                            )
                          }
                        >
                          <div className="flex h-9 items-center">
                            <AppSelectTrigger className="w-full">
                              <AppSelectValue placeholder="اختر أيقونة" />
                            </AppSelectTrigger>
                            <AppSelectContent>
                              {COMMUNITY_ICON_OPTIONS.map((o) => (
                                <AppSelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </AppSelectItem>
                              ))}
                            </AppSelectContent>
                          </div>
                        </AppSelect>
                      </Field>
                      <Field label="العنوان">
                        <AppInput
                          value={feature.title}
                          onChange={(e) =>
                            updateFeatures((prev) =>
                              prev.map((f) =>
                                f.id === feature.id
                                  ? { ...f, title: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          placeholder="إجابات سريعة"
                        />
                      </Field>
                      <Field label="الوصف">
                        <AppInput
                          value={feature.desc}
                          onChange={(e) =>
                            updateFeatures((prev) =>
                              prev.map((f) =>
                                f.id === feature.id
                                  ? { ...f, desc: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          placeholder="ردود فورية من الزملاء"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                {form.features.length < 6 && (
                  <AppButton
                    variant="outline"
                    onClick={() =>
                      updateFeatures((prev) => [
                        ...prev,
                        createFeature({
                          title: "ميزة جديدة",
                          desc: "وصف الميزة",
                          icon: "star",
                        }),
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    إضافة ميزة
                  </AppButton>
                )}
              </AppCardContent>
            </AppCard>

            {/* Design-specific settings */}
            {form.design === "gradient" && (
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات تصميم «التدرّج الملون»</AppCardTitle>
                  <AppCardDescription>بطاقة الإبراز والوهج الخلفي</AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <Field label="عنوان بطاقة الإبراز">
                    <AppInput
                      value={form.gradient.highlightTitle}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          gradient: { ...f.gradient, highlightTitle: e.target.value },
                        }))
                      }
                      placeholder="مجتمع نشيط على مدار الساعة"
                    />
                  </Field>
                  <Field label="نص بطاقة الإبراز">
                    <AppTextarea
                      value={form.gradient.highlightText}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          gradient: { ...f.gradient, highlightText: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder="انضم لآلاف الطلاب..."
                    />
                  </Field>
                  <SwitchRow
                    label="تفعيل الوهج الملون خلف التصميم"
                    checked={form.gradient.showGlow}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        gradient: { ...f.gradient, showGlow: v },
                      }))
                    }
                  />
                </AppCardContent>
              </AppCard>
            )}

            {form.design === "spotlight" && (
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات تصميم «الأضواء المركزة»</AppCardTitle>
                  <AppCardDescription>الصورة الجانبية والاقتباس</AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <Field label="رابط الصورة الجانبية (اختياري)" hint="اتركه فارغاً لإظهار خلفية متدرجة أنيقة">
                    <AppInput
                      dir="ltr"
                      value={form.spotlight.imageUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          spotlight: { ...f.spotlight, imageUrl: e.target.value },
                        }))
                      }
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="الاقتباس المعروض على الصورة">
                    <AppTextarea
                      value={form.spotlight.quote}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          spotlight: { ...f.spotlight, quote: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder="السؤال الجيد هو نصف الإجابة..."
                    />
                  </Field>
                </AppCardContent>
              </AppCard>
            )}

            {form.design === "bento" && (
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات تصميم «شبكة بينتو»</AppCardTitle>
                  <AppCardDescription>سطر الملاحظة أسفل الشبكة</AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <Field label="ملاحظة سفلية">
                    <AppInput
                      value={form.bento.footerNote}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bento: { ...f.bento, footerNote: e.target.value },
                        }))
                      }
                      placeholder="كل ما تحتاجه لمشاركتك الدراسية في مكان واحد"
                    />
                  </Field>
                </AppCardContent>
              </AppCard>
            )}

            {form.design === "minimal" && (
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات تصميم «المينيمال الهادئ»</AppCardTitle>
                  <AppCardDescription>الشريط المتحرك (Ticker) أسفل السكشن</AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <SwitchRow
                    label="إظهار الشريط المتحرك"
                    checked={form.minimal.showTicker}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        minimal: { ...f.minimal, showTicker: v },
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">عناصر الشريط المتحرك</label>
                    {form.minimal.tickerItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <AppInput
                          value={item}
                          onChange={(e) =>
                            updateTicker((prev) =>
                              prev.map((t, i) => (i === idx ? e.target.value : t)),
                            )
                          }
                          placeholder={`عنصر ${idx + 1}`}
                        />
                        <AppButton
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            updateTicker((prev) => prev.filter((_, i) => i !== idx))
                          }
                          disabled={form.minimal.tickerItems.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </AppButton>
                      </div>
                    ))}
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={() => updateTicker((prev) => [...prev, "عنصر جديد"])}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة عنصر
                    </AppButton>
                  </div>
                </AppCardContent>
              </AppCard>
            )}

            <div className="flex justify-end">
              <AppButton onClick={save} loading={saving} disabled={saving}>
                حفظ الإعدادات
              </AppButton>
            </div>
          </div>
        </AppTabsContent>

        {/* ───────────────── Preview tab ───────────────── */}
        <AppTabsContent value="preview">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: PRIMARY }} />
                معاينة حية
              </AppCardTitle>
              <AppCardDescription>
                هذه المعاينة تستخدم المحتوى الحالي في النموذج (والإحصائيات الحية من
                المنتدى). احفظ التغييرات لرؤيتها على الصفحة الرئيسية.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <CommunitySectionRenderer settings={form} />
              </div>
              <div className="mt-4 flex justify-end">
                <AppButton onClick={save} loading={saving} disabled={saving}>
                  حفظ الإعدادات
                </AppButton>
              </div>
            </AppCardContent>
          </AppCard>
        </AppTabsContent>
      </AppTabs>
    </AppPage>
  );
}
