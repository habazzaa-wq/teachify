"use client";

import { useState } from "react";
import {
  LinkIcon,
  MapPin,
  Plus,
  Quote,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppTabs,
  AppTabsContent,
  AppTabsList,
  AppTabsTrigger,
  AppTextarea,
  Label,
} from "@/components/ui";
import { useAboutSettings, useUpdateAboutSettings } from "@/features/about/hooks";
import { ABOUT_ICON_OPTIONS } from "@/features/about/types";
import type {
  AboutIconName,
  AboutSettings,
  AboutStat,
  AboutStep,
  AboutStoryPoint,
  AboutValue,
} from "@/features/about/types";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import { mediaLibraryService } from "@/features/media-library/services";
import { toAbsoluteAssetUrl } from "@/lib/url";

function cloneAbout(data: AboutSettings): AboutSettings {
  return {
    hero: { ...data.hero },
    stats: data.stats.map((item) => ({ ...item })),
    story: {
      ...data.story,
      paragraphs: [...data.story.paragraphs],
      points: data.story.points.map((item) => ({ ...item })),
    },
    journey: { ...data.journey, steps: data.journey.steps.map((item) => ({ ...item })) },
    values: { ...data.values, items: data.values.items.map((item) => ({ ...item })) },
    quote: { ...data.quote },
    location: { ...data.location },
    cta: { ...data.cta },
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  dir = "rtl",
  multiline = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr" | "auto";
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <AppTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          dir={dir}
        />
      ) : (
        <AppInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
        />
      )}
    </div>
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <AppSelect value={value} onValueChange={(next) => onChange(next as AboutIconName)}>
        <AppSelectTrigger className="w-full">
          <AppSelectValue />
        </AppSelectTrigger>
        <AppSelectContent>
          {ABOUT_ICON_OPTIONS.map((option) => (
            <AppSelectItem key={option.value} value={option.value}>
              {option.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>
    </div>
  );
}

function ItemShell({
  index,
  title,
  onRemove,
  children,
}: {
  index: number;
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-studio-fg">
          {index + 1}. {title}
        </span>
        <AppButton
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
          aria-label="حذف العنصر"
        >
          <Trash2 className="h-4 w-4" />
        </AppButton>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

type DraftApi = {
  draft: AboutSettings;
  setDraft: React.Dispatch<React.SetStateAction<AboutSettings>>;
};

function HeroTab({ draft, setDraft }: DraftApi) {
  const updateHero = (patch: Partial<AboutSettings["hero"]>) =>
    setDraft((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  const updateCta = (patch: Partial<AboutSettings["cta"]>) =>
    setDraft((prev) => ({ ...prev, cta: { ...prev.cta, ...patch } }));

  const updateStat = (index: number, patch: Partial<AboutStat>) =>
    setDraft((prev) => ({
      ...prev,
      stats: prev.stats.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  const addStat = () =>
    setDraft((prev) => ({
      ...prev,
      stats: [...prev.stats, { id: makeId("stat"), value: "٠١", label: "عنصر جديد" }],
    }));
  const removeStat = (index: number) =>
    setDraft((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));

  return (
    <div className="space-y-6">
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> مقدمة الصفحة
          </AppCardTitle>
          <AppCardDescription>العنوان والوصف والأزرار التي تظهر في أعلى صفحة من نحن</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="العنوان الصغير (Eyebrow)" value={draft.hero.eyebrow} onChange={(v) => updateHero({ eyebrow: v })} />
          <TextField label="العنوان الرئيسي" value={draft.hero.title} onChange={(v) => updateHero({ title: v })} />
          <TextField label="الوصف" value={draft.hero.description} onChange={(v) => updateHero({ description: v })} multiline rows={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="نص الزر الأول" value={draft.hero.primaryLabel} onChange={(v) => updateHero({ primaryLabel: v })} />
            <TextField label="رابط الزر الأول" value={draft.hero.primaryHref} onChange={(v) => updateHero({ primaryHref: v })} dir="ltr" placeholder="/courses" />
            <TextField label="نص الزر الثاني" value={draft.hero.secondaryLabel} onChange={(v) => updateHero({ secondaryLabel: v })} />
            <TextField label="رابط الزر الثاني" value={draft.hero.secondaryHref} onChange={(v) => updateHero({ secondaryHref: v })} dir="ltr" placeholder="#about-story" />
          </div>

          <div className="space-y-2">
            <Label>صورة البطاقة (اختياري)</Label>
            <div className="flex flex-wrap gap-2">
              <AppInput
                dir="ltr"
                value={draft.hero.image}
                onChange={(e) => updateHero({ image: e.target.value })}
                placeholder="https://... أو /api/v1/media/serve/..."
              />
              <ChooseMediaButton
                mode="single"
                allowedTypes={["image"]}
                label="اختيار من مكتبة الوسائط"
                onSelect={async (result) => {
                  try {
                    const asset = await mediaLibraryService.getAsset(result.id);
                    const url = toAbsoluteAssetUrl(asset?.cdnUrl);
                    if (url) updateHero({ image: url });
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              اترك الحقل فارغًا لعرض البطاقة التصميمية الافتراضية.
            </p>
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="flex-row items-center justify-between">
          <div>
            <AppCardTitle>الأرقام السريعة ({draft.stats.length})</AppCardTitle>
            <AppCardDescription>تظهر في شريط صغير مباشرة بعد المقدمة</AppCardDescription>
          </div>
          <AppButton type="button" size="sm" variant="outline" onClick={addStat}>
            <Plus className="h-4 w-4" /> إضافة رقم
          </AppButton>
        </AppCardHeader>
        <AppCardContent className="space-y-3">
          {draft.stats.map((item, index) => (
            <ItemShell key={item.id} index={index} title={item.label || "رقم"} onRemove={() => removeStat(index)}>
              <TextField label="القيمة" value={item.value} onChange={(v) => updateStat(index, { value: v })} />
              <TextField label="الوصف" value={item.label} onChange={(v) => updateStat(index, { label: v })} />
            </ItemShell>
          ))}
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> الدعوة الختامية
          </AppCardTitle>
          <AppCardDescription>الرسالة الأخيرة التي تدعو الزائر للبدء</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="العنوان الصغير" value={draft.cta.eyebrow} onChange={(v) => updateCta({ eyebrow: v })} />
          <TextField label="العنوان" value={draft.cta.title} onChange={(v) => updateCta({ title: v })} />
          <TextField label="الوصف" value={draft.cta.description} onChange={(v) => updateCta({ description: v })} multiline />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="نص الزر" value={draft.cta.buttonLabel} onChange={(v) => updateCta({ buttonLabel: v })} />
            <TextField label="رابط الزر" value={draft.cta.buttonHref} onChange={(v) => updateCta({ buttonHref: v })} dir="ltr" />
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

function StoryTab({ draft, setDraft }: DraftApi) {
  const updateStory = (patch: Partial<AboutSettings["story"]>) =>
    setDraft((prev) => ({ ...prev, story: { ...prev.story, ...patch } }));
  const updateJourney = (patch: Partial<AboutSettings["journey"]>) =>
    setDraft((prev) => ({ ...prev, journey: { ...prev.journey, ...patch } }));

  const setParagraph = (index: number, value: string) =>
    setDraft((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        paragraphs: prev.story.paragraphs.map((item, i) => (i === index ? value : item)),
      },
    }));
  const addParagraph = () =>
    setDraft((prev) => ({
      ...prev,
      story: { ...prev.story, paragraphs: [...prev.story.paragraphs, ""] },
    }));
  const removeParagraph = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      story: { ...prev.story, paragraphs: prev.story.paragraphs.filter((_, i) => i !== index) },
    }));

  const updatePoint = (index: number, patch: Partial<AboutStoryPoint>) =>
    setDraft((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        points: prev.story.points.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      },
    }));
  const addPoint = () =>
    setDraft((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        points: [
          ...prev.story.points,
          { id: makeId("point"), title: "عنوان جديد", description: "", icon: "sparkles" },
        ],
      },
    }));
  const removePoint = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      story: { ...prev.story, points: prev.story.points.filter((_, i) => i !== index) },
    }));

  const updateStep = (index: number, patch: Partial<AboutStep>) =>
    setDraft((prev) => ({
      ...prev,
      journey: {
        ...prev.journey,
        steps: prev.journey.steps.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      },
    }));
  const addStep = () =>
    setDraft((prev) => ({
      ...prev,
      journey: {
        ...prev.journey,
        steps: [
          ...prev.journey.steps,
          {
            id: makeId("step"),
            number: String(prev.journey.steps.length + 1).padStart(2, "0"),
            title: "مرحلة جديدة",
            description: "",
            icon: "target",
          },
        ],
      },
    }));
  const removeStep = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      journey: { ...prev.journey, steps: prev.journey.steps.filter((_, i) => i !== index) },
    }));

  return (
    <div className="space-y-6">
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>قصتنا</AppCardTitle>
          <AppCardDescription>النص التعريفي والمحطات الثلاث التي تلخّص طريقة عملك</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="العنوان الصغير" value={draft.story.eyebrow} onChange={(v) => updateStory({ eyebrow: v })} />
          <TextField label="العنوان" value={draft.story.title} onChange={(v) => updateStory({ title: v })} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>الفقرات</Label>
              <AppButton type="button" size="sm" variant="ghost" onClick={addParagraph}>
                <Plus className="h-3.5 w-3.5" /> إضافة فقرة
              </AppButton>
            </div>
            {draft.story.paragraphs.map((paragraph, index) => (
              <div key={index} className="flex items-start gap-2">
                <AppTextarea
                  value={paragraph}
                  onChange={(e) => setParagraph(index, e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <AppButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => removeParagraph(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>المحطات السريعة</Label>
              <AppButton type="button" size="sm" variant="ghost" onClick={addPoint}>
                <Plus className="h-3.5 w-3.5" /> إضافة محطة
              </AppButton>
            </div>
            {draft.story.points.map((point, index) => (
              <ItemShell key={point.id} index={index} title={point.title || "محطة"} onRemove={() => removePoint(index)}>
                <TextField label="العنوان" value={point.title} onChange={(v) => updatePoint(index, { title: v })} />
                <IconField label="الأيقونة" value={point.icon} onChange={(v) => updatePoint(index, { icon: v })} />
                <div className="sm:col-span-2">
                  <TextField label="الوصف" value={point.description} onChange={(v) => updatePoint(index, { description: v })} />
                </div>
              </ItemShell>
            ))}
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="flex-row items-center justify-between">
          <div>
            <AppCardTitle>رحلة المتعلّم ({draft.journey.steps.length})</AppCardTitle>
            <AppCardDescription>المراحل التي تظهر كبطاقات متتالية</AppCardDescription>
          </div>
          <AppButton type="button" size="sm" variant="outline" onClick={addStep}>
            <Plus className="h-4 w-4" /> إضافة مرحلة
          </AppButton>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="العنوان الصغير" value={draft.journey.eyebrow} onChange={(v) => updateJourney({ eyebrow: v })} />
          <TextField label="العنوان" value={draft.journey.title} onChange={(v) => updateJourney({ title: v })} />
          <TextField label="الوصف" value={draft.journey.description} onChange={(v) => updateJourney({ description: v })} multiline />
          {draft.journey.steps.map((step, index) => (
            <ItemShell key={step.id} index={index} title={step.title || "مرحلة"} onRemove={() => removeStep(index)}>
              <TextField label="الرقم" value={step.number} onChange={(v) => updateStep(index, { number: v })} />
              <TextField label="العنوان" value={step.title} onChange={(v) => updateStep(index, { title: v })} />
              <IconField label="الأيقونة" value={step.icon} onChange={(v) => updateStep(index, { icon: v })} />
              <div className="sm:col-span-2">
                <TextField label="الوصف" value={step.description} onChange={(v) => updateStep(index, { description: v })} />
              </div>
            </ItemShell>
          ))}
        </AppCardContent>
      </AppCard>
    </div>
  );
}

function ValuesTab({ draft, setDraft }: DraftApi) {
  const updateValues = (patch: Partial<AboutSettings["values"]>) =>
    setDraft((prev) => ({ ...prev, values: { ...prev.values, ...patch } }));
  const updateQuote = (patch: Partial<AboutSettings["quote"]>) =>
    setDraft((prev) => ({ ...prev, quote: { ...prev.quote, ...patch } }));

  const updateItem = (index: number, patch: Partial<AboutValue>) =>
    setDraft((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        items: prev.values.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      },
    }));
  const addItem = () =>
    setDraft((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        items: [
          ...prev.values.items,
          { id: makeId("value"), title: "قيمة جديدة", description: "", icon: "sparkles" },
        ],
      },
    }));
  const removeItem = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      values: { ...prev.values, items: prev.values.items.filter((_, i) => i !== index) },
    }));

  return (
    <div className="space-y-6">
      <AppCard>
        <AppCardHeader className="flex-row items-center justify-between">
          <div>
            <AppCardTitle>القيم ({draft.values.items.length})</AppCardTitle>
            <AppCardDescription>بطاقات صغيرة تعرض المبادئ التي تصنع تجربتك</AppCardDescription>
          </div>
          <AppButton type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4" /> إضافة قيمة
          </AppButton>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="العنوان الصغير" value={draft.values.eyebrow} onChange={(v) => updateValues({ eyebrow: v })} />
          <TextField label="العنوان" value={draft.values.title} onChange={(v) => updateValues({ title: v })} />
          <TextField label="الوصف" value={draft.values.description} onChange={(v) => updateValues({ description: v })} multiline />
          {draft.values.items.map((item, index) => (
            <ItemShell key={item.id} index={index} title={item.title || "قيمة"} onRemove={() => removeItem(index)}>
              <TextField label="العنوان" value={item.title} onChange={(v) => updateItem(index, { title: v })} />
              <IconField label="الأيقونة" value={item.icon} onChange={(v) => updateItem(index, { icon: v })} />
              <div className="sm:col-span-2">
                <TextField label="الوصف" value={item.description} onChange={(v) => updateItem(index, { description: v })} />
              </div>
            </ItemShell>
          ))}
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Quote className="h-4 w-4" /> الاقتباس
          </AppCardTitle>
          <AppCardDescription>رسالة قصيرة تظهر في شريط مميز قبل الموقع</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <TextField label="النص" value={draft.quote.text} onChange={(v) => updateQuote({ text: v })} multiline rows={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="الاسم" value={draft.quote.author} onChange={(v) => updateQuote({ author: v })} />
            <TextField label="الوصف الوظيفي" value={draft.quote.role} onChange={(v) => updateQuote({ role: v })} />
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

function LocationTab({ draft, setDraft }: DraftApi) {
  const update = (patch: Partial<AboutSettings["location"]>) =>
    setDraft((prev) => ({ ...prev, location: { ...prev.location, ...patch } }));

  return (
    <AppCard>
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> الموقع وبيانات التواصل
        </AppCardTitle>
        <AppCardDescription>
          تُستخدم هذه البيانات في خريطة جوجل وفي بطاقة التواصل بصفحة من نحن
        </AppCardDescription>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="العنوان الصغير" value={draft.location.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextField label="العنوان" value={draft.location.title} onChange={(v) => update({ title: v })} />
        </div>
        <TextField label="الوصف" value={draft.location.description} onChange={(v) => update({ description: v })} multiline />
        <TextField
          label="العنوان النصي المعروض"
          value={draft.location.address}
          onChange={(v) => update({ address: v })}
          placeholder="القاهرة، جمهورية مصر العربية"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="كلمة البحث في خرائط جوجل"
            value={draft.location.query}
            onChange={(v) => update({ query: v })}
            dir="ltr"
            placeholder="Cairo, Egypt"
          />
          <TextField
            label="رابط الاتجاهات المخصص (اختياري)"
            value={draft.location.directionsUrl}
            onChange={(v) => update({ directionsUrl: v })}
            dir="ltr"
            placeholder="https://www.google.com/maps/dir/..."
          />
          <TextField label="خط العرض (Latitude)" value={draft.location.lat} onChange={(v) => update({ lat: v })} dir="ltr" />
          <TextField label="خط الطول (Longitude)" value={draft.location.lng} onChange={(v) => update({ lng: v })} dir="ltr" />
          <TextField label="مستوى التكبير" value={draft.location.zoom} onChange={(v) => update({ zoom: v })} dir="ltr" placeholder="13" />
        </div>
        <p className="text-xs text-muted-foreground">
          إذا أضفت كلمة بحث، ستُستخدم في الخريطة. وإلا سيتم استخدام خطي العرض والطول.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="الهاتف" value={draft.location.phone} onChange={(v) => update({ phone: v })} dir="ltr" />
          <TextField label="البريد الإلكتروني" value={draft.location.email} onChange={(v) => update({ email: v })} dir="ltr" />
          <TextField label="ساعات العمل" value={draft.location.hours} onChange={(v) => update({ hours: v })} />
          <TextField
            label="رقم الواتساب (أرقام فقط)"
            value={draft.location.whatsapp}
            onChange={(v) => update({ whatsapp: v })}
            dir="ltr"
            placeholder="201011245565"
          />
        </div>
      </AppCardContent>
    </AppCard>
  );
}

function AboutEditor({ initial }: { initial: AboutSettings }) {
  const [draft, setDraft] = useState<AboutSettings>(() => cloneAbout(initial));
  const updateAbout = useUpdateAboutSettings();

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="محتوى صفحة من نحن"
        description="عدّل كل أقسام صفحة من نحن: المقدمة، القصة، الرحلة، القيم، الاقتباس، والموقع على خرائط جوجل"
      />
      <AppDivider className="mb-6" />

      <AppTabs defaultValue="hero">
        <AppTabsList>
          <AppTabsTrigger value="hero">
            <Sparkles className="ml-1 h-3.5 w-3.5" /> المقدمة والأرقام
          </AppTabsTrigger>
          <AppTabsTrigger value="story">القصة والرحلة</AppTabsTrigger>
          <AppTabsTrigger value="values">القيم والاقتباس</AppTabsTrigger>
          <AppTabsTrigger value="location">
            <MapPin className="ml-1 h-3.5 w-3.5" /> الموقع والتواصل
          </AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="hero">
          <HeroTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>
        <AppTabsContent value="story">
          <StoryTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>
        <AppTabsContent value="values">
          <ValuesTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>
        <AppTabsContent value="location">
          <LocationTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>
      </AppTabs>

      <div className="mt-6 flex justify-end border-t border-border pt-6">
        <AppButton onClick={() => updateAbout.mutate(draft)} loading={updateAbout.isPending}>
          <Save className="h-4 w-4 ml-1" /> حفظ محتوى صفحة من نحن
        </AppButton>
      </div>
    </AppPage>
  );
}

export default function AboutSettingsPage() {
  const { data, isLoading, isError, refetch } = useAboutSettings();

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  return <AboutEditor initial={data} />;
}
