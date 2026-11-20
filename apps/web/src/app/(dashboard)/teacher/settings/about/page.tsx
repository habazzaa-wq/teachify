"use client";

import { useState } from "react";
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppDivider,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppPage,
  AppPageHeader,
  AppSwitch,
  AppTextarea,
} from "@/components/ui";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useAboutPageSettings, useUpdateAboutPageSettings } from "@/features/about-page/hooks";
import { ABOUT_ICON_NAMES, mergeAboutPageSettings, type AboutIconName, type AboutPageSettings } from "@/features/about-page/types";
import { AboutIcon } from "@/features/about-page/icons";

const iconLabels: Record<AboutIconName, string> = {
  Award: "إنجاز",
  BookOpen: "كتاب",
  Compass: "بوصلة",
  Globe: "عالم",
  GraduationCap: "قبعة تخرج",
  Heart: "قلب",
  Lightbulb: "فكرة",
  Rocket: "انطلاق",
  School: "مدرسة",
  ShieldCheck: "ثقة",
  Sparkles: "إبداع",
  Star: "نجمة",
  Target: "هدف",
  Users: "مجتمع",
};

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {multiline ? (
        <AppTextarea dir={dir} value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      ) : (
        <AppInput dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function IconField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AboutIconName;
  onChange: (value: AboutIconName) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AboutIcon name={value} className="h-5 w-5" />
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as AboutIconName)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {ABOUT_ICON_NAMES.map((name) => <option key={name} value={name}>{iconLabels[name]}</option>)}
        </select>
      </span>
    </label>
  );
}

function AboutPageEditor({ initial }: { initial: AboutPageSettings }) {
  const [draft, setDraft] = useState(initial);
  const updateAbout = useUpdateAboutPageSettings();
  const saving = updateAbout.isPending;

  const moveItem = <T,>(items: T[], index: number, direction: "up" | "down"): T[] => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    const currentItem = next[index];
    const targetItem = next[target];
    if (currentItem === undefined || targetItem === undefined) return items;
    next[index] = targetItem;
    next[target] = currentItem;
    return next;
  };

  const addStat = () => setDraft((current) => ({
    ...current,
    stats: [...current.stats, { id: `stat-${Date.now()}`, value: "", label: "", icon: "Star" }],
  }));
  const addHighlight = () => setDraft((current) => ({
    ...current,
    highlights: {
      ...current.highlights,
      items: [...current.highlights.items, { id: `highlight-${Date.now()}`, title: "", description: "", icon: "Sparkles" }],
    },
  }));

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="صفحة من نحن"
        description="صمّم قصة أكاديميتك، وأدر محتواها وأيقوناتها ورابطها العام من مكان واحد."
      />
      <AppDivider className="mb-6" />

      <div className="space-y-6">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>النشر والتنقل</AppCardTitle>
            <AppCardDescription>عند التفعيل، تظهر الصفحة للزوار ورابطها في قائمة الموقع.</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="grid gap-5 md:grid-cols-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 md:col-span-1">
              <div>
                <p className="font-semibold">تفعيل الصفحة</p>
                <p className="mt-1 text-xs text-muted-foreground">إظهار الصفحة للزوار</p>
              </div>
              <AppSwitch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} />
            </div>
            <TextField label="اسم الرابط في القائمة" value={draft.navLabel} onChange={(navLabel) => setDraft({ ...draft, navLabel })} />
            <IconField label="أيقونة الرابط" value={draft.navIcon} onChange={(navIcon) => setDraft({ ...draft, navIcon })} />
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>واجهة الصفحة</AppCardTitle>
            <AppCardDescription>العنوان الرئيسي، صورة الخلفية، الدعوة إلى الإجراء والأيقونة.</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="grid gap-5 md:grid-cols-2">
            <TextField label="النص التمهيدي" value={draft.hero.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow } })} />
            <IconField label="أيقونة الواجهة" value={draft.hero.icon} onChange={(icon) => setDraft({ ...draft, hero: { ...draft.hero, icon } })} />
            <TextField label="العنوان" value={draft.hero.title} onChange={(title) => setDraft({ ...draft, hero: { ...draft.hero, title } })} />
            <TextField label="النص المميز في العنوان" value={draft.hero.accent} onChange={(accent) => setDraft({ ...draft, hero: { ...draft.hero, accent } })} />
            <div className="md:col-span-2">
              <TextField label="الوصف" value={draft.hero.description} onChange={(description) => setDraft({ ...draft, hero: { ...draft.hero, description } })} multiline />
            </div>
            <TextField label="رابط صورة الواجهة (اختياري)" value={draft.hero.image} onChange={(image) => setDraft({ ...draft, hero: { ...draft.hero, image } })} dir="ltr" />
            <TextField label="نص الزر" value={draft.hero.primaryActionLabel} onChange={(primaryActionLabel) => setDraft({ ...draft, hero: { ...draft.hero, primaryActionLabel } })} />
            <div className="md:col-span-2">
              <TextField label="وجهة الزر" value={draft.hero.primaryActionUrl} onChange={(primaryActionUrl) => setDraft({ ...draft, hero: { ...draft.hero, primaryActionUrl } })} dir="ltr" />
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>قصتنا</AppCardTitle>
            <AppCardDescription>عرّف الزوار برؤية الأكاديمية ورسالتها.</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="grid gap-5 md:grid-cols-2">
            <TextField label="العنوان التمهيدي" value={draft.story.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, story: { ...draft.story, eyebrow } })} />
            <IconField label="أيقونة القصة" value={draft.story.icon} onChange={(icon) => setDraft({ ...draft, story: { ...draft.story, icon } })} />
            <div className="md:col-span-2">
              <TextField label="العنوان" value={draft.story.title} onChange={(title) => setDraft({ ...draft, story: { ...draft.story, title } })} />
            </div>
            <div className="md:col-span-2">
              <TextField label="النص" value={draft.story.body} onChange={(body) => setDraft({ ...draft, story: { ...draft.story, body } })} multiline />
            </div>
            <div className="md:col-span-2">
              <TextField label="اقتباس بارز (اختياري)" value={draft.story.quote} onChange={(quote) => setDraft({ ...draft, story: { ...draft.story, quote } })} multiline />
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <AppCardTitle>أرقامنا</AppCardTitle>
              <AppCardDescription>أضف مؤشرات مختصرة أو احذف ما لا تحتاجه.</AppCardDescription>
            </div>
            <AppButton size="sm" variant="outline" onClick={addStat}><Plus className="h-4 w-4" /> إضافة رقم</AppButton>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            {draft.stats.map((stat, index) => (
              <div key={stat.id} className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                <TextField label="القيمة" value={stat.value} onChange={(value) => setDraft({ ...draft, stats: draft.stats.map((item, i) => i === index ? { ...item, value } : item) })} />
                <TextField label="الوصف" value={stat.label} onChange={(label) => setDraft({ ...draft, stats: draft.stats.map((item, i) => i === index ? { ...item, label } : item) })} />
                <IconField label="الأيقونة" value={stat.icon} onChange={(icon) => setDraft({ ...draft, stats: draft.stats.map((item, i) => i === index ? { ...item, icon } : item) })} />
                <div className="flex items-end gap-1">
                  <AppButton variant="ghost" size="icon" disabled={index === 0} onClick={() => setDraft({ ...draft, stats: moveItem(draft.stats, index, "up") })} aria-label="تحريك لأعلى"><ArrowUp className="h-4 w-4" /></AppButton>
                  <AppButton variant="ghost" size="icon" disabled={index === draft.stats.length - 1} onClick={() => setDraft({ ...draft, stats: moveItem(draft.stats, index, "down") })} aria-label="تحريك لأسفل"><ArrowDown className="h-4 w-4" /></AppButton>
                  <AppButton variant="ghost" size="icon" onClick={() => setDraft({ ...draft, stats: draft.stats.filter((_, i) => i !== index) })} aria-label="حذف الرقم"><Trash2 className="h-4 w-4 text-destructive" /></AppButton>
                </div>
              </div>
            ))}
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <AppCardTitle>مميزات الأكاديمية</AppCardTitle>
              <AppCardDescription>تحكم في عنوان هذا القسم وبطاقاته وأيقوناتها وترتيبها.</AppCardDescription>
            </div>
            <AppButton size="sm" variant="outline" onClick={addHighlight}><Plus className="h-4 w-4" /> إضافة ميزة</AppButton>
          </AppCardHeader>
          <AppCardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="العنوان التمهيدي" value={draft.highlights.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, highlights: { ...draft.highlights, eyebrow } })} />
              <TextField label="عنوان القسم" value={draft.highlights.title} onChange={(title) => setDraft({ ...draft, highlights: { ...draft.highlights, title } })} />
              <div className="md:col-span-2">
                <TextField label="وصف القسم" value={draft.highlights.description} onChange={(description) => setDraft({ ...draft, highlights: { ...draft.highlights, description } })} multiline />
              </div>
            </div>
            {draft.highlights.items.map((item, index) => (
              <div key={item.id} className="space-y-4 rounded-xl border border-border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="عنوان الميزة" value={item.title} onChange={(title) => setDraft({ ...draft, highlights: { ...draft.highlights, items: draft.highlights.items.map((entry, i) => i === index ? { ...entry, title } : entry) } })} />
                  <IconField label="الأيقونة" value={item.icon} onChange={(icon) => setDraft({ ...draft, highlights: { ...draft.highlights, items: draft.highlights.items.map((entry, i) => i === index ? { ...entry, icon } : entry) } })} />
                  <div className="md:col-span-2">
                    <TextField label="الوصف" value={item.description} onChange={(description) => setDraft({ ...draft, highlights: { ...draft.highlights, items: draft.highlights.items.map((entry, i) => i === index ? { ...entry, description } : entry) } })} multiline />
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <AppButton variant="ghost" size="icon" disabled={index === 0} onClick={() => setDraft({ ...draft, highlights: { ...draft.highlights, items: moveItem(draft.highlights.items, index, "up") } })} aria-label="تحريك لأعلى"><ArrowUp className="h-4 w-4" /></AppButton>
                  <AppButton variant="ghost" size="icon" disabled={index === draft.highlights.items.length - 1} onClick={() => setDraft({ ...draft, highlights: { ...draft.highlights, items: moveItem(draft.highlights.items, index, "down") } })} aria-label="تحريك لأسفل"><ArrowDown className="h-4 w-4" /></AppButton>
                  <AppButton variant="ghost" size="icon" onClick={() => setDraft({ ...draft, highlights: { ...draft.highlights, items: draft.highlights.items.filter((_, i) => i !== index) } })} aria-label="حذف الميزة"><Trash2 className="h-4 w-4 text-destructive" /></AppButton>
                </div>
              </div>
            ))}
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>الدعوة الختامية</AppCardTitle>
            <AppCardDescription>رسالة أخيرة تشجع الزائر على اتخاذ الخطوة التالية.</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="grid gap-5 md:grid-cols-2">
            <TextField label="العنوان التمهيدي" value={draft.cta.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, cta: { ...draft.cta, eyebrow } })} />
            <IconField label="الأيقونة" value={draft.cta.icon} onChange={(icon) => setDraft({ ...draft, cta: { ...draft.cta, icon } })} />
            <TextField label="العنوان" value={draft.cta.title} onChange={(title) => setDraft({ ...draft, cta: { ...draft.cta, title } })} />
            <TextField label="نص الزر" value={draft.cta.buttonLabel} onChange={(buttonLabel) => setDraft({ ...draft, cta: { ...draft.cta, buttonLabel } })} />
            <div className="md:col-span-2">
              <TextField label="الوصف" value={draft.cta.description} onChange={(description) => setDraft({ ...draft, cta: { ...draft.cta, description } })} multiline />
            </div>
            <div className="md:col-span-2">
              <TextField label="وجهة الزر" value={draft.cta.buttonUrl} onChange={(buttonUrl) => setDraft({ ...draft, cta: { ...draft.cta, buttonUrl } })} dir="ltr" />
            </div>
          </AppCardContent>
        </AppCard>

        <div className="flex items-center justify-between border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">رابط الصفحة: <span className="font-mono" dir="ltr">/about</span></p>
          <AppButton onClick={() => updateAbout.mutate(draft)} loading={saving}>
            <Save className="h-4 w-4" /> حفظ الصفحة
          </AppButton>
        </div>
      </div>
    </AppPage>
  );
}

export default function AboutPageSettingsScreen() {
  const { data, isLoading, isError, refetch } = useAboutPageSettings();

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  return <AboutPageEditor initial={mergeAboutPageSettings(data)} />;
}
