"use client";

import { useState } from "react";
import { Plus, Trash2, LinkIcon, GripVertical } from "lucide-react";
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
  AppLoadingState,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
} from "@/components/ui";
import { useFooterSettings, useUpdateFooterSettings } from "@/features/footer/hooks";
import type { FooterSettings, FooterLink, FooterLinkGroup } from "@/features/footer/types";

function cloneFooter(footer: FooterSettings): FooterSettings {
  return {
    ...footer,
    contact: { ...footer.contact },
    socials: { ...footer.socials },
    groups: footer.groups.map((group) => ({
      ...group,
      links: group.links.map((link) => ({ ...link })),
    })),
  };
}

function ContentTab({
  draft,
  setDraft,
}: {
  draft: FooterSettings;
  setDraft: (next: FooterSettings) => void;
}) {
  const updateGroup = (gIndex: number, patch: Partial<FooterLinkGroup>) => {
    setDraft({
      ...draft,
      groups: draft.groups.map((g, i) => (i === gIndex ? { ...g, ...patch } : g)),
    });
  };

  const removeGroup = (gIndex: number) => {
    setDraft({ ...draft, groups: draft.groups.filter((_, i) => i !== gIndex) });
  };

  const addGroup = () => {
    setDraft({
      ...draft,
      groups: [...draft.groups, { heading: "", links: [{ label: "", href: "" }] }],
    });
  };

  const moveGroup = (gIndex: number, direction: "up" | "down") => {
    const next = direction === "up" ? gIndex - 1 : gIndex + 1;
    if (next < 0 || next >= draft.groups.length) return;
    const groups = [...draft.groups];
    const a = groups[gIndex];
    const b = groups[next];
    if (a === undefined || b === undefined) return;
    groups[gIndex] = b;
    groups[next] = a;
    setDraft({ ...draft, groups });
  };

  const updateLink = (gIndex: number, lIndex: number, patch: Partial<FooterLink>) => {
    setDraft({
      ...draft,
      groups: draft.groups.map((g, gi) =>
        gi === gIndex ? { ...g, links: g.links.map((l, li) => (li === lIndex ? { ...l, ...patch } : l)) } : g,
      ),
    });
  };

  const removeLink = (gIndex: number, lIndex: number) => {
    setDraft({
      ...draft,
      groups: draft.groups.map((g, gi) =>
        gi === gIndex ? { ...g, links: g.links.filter((_, li) => li !== lIndex) } : g,
      ),
    });
  };

  const addLink = (gIndex: number) => {
    setDraft({
      ...draft,
      groups: draft.groups.map((g, gi) => (gi === gIndex ? { ...g, links: [...g.links, { label: "", href: "" }] } : g)),
    });
  };

  return (
    <div className="space-y-6">
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>المحتوى والمقدمة</AppCardTitle>
          <AppCardDescription>
            النص التعريفي الذي يظهر بجانب شعار المنصة في الفوتر
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">نص تقديمي عن المنصة</label>
            <AppTextarea
              value={draft.aboutText}
              onChange={(e) => setDraft({ ...draft, aboutText: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">الوصف المختصر (تحت الاسم)</label>
            <AppInput
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              placeholder="منظومة تعليمية متكاملة"
            />
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="flex-row items-center justify-between">
          <div>
            <AppCardTitle>مجموعات الروابط ({draft.groups.length})</AppCardTitle>
            <AppCardDescription>
              كل مجموعة لها عنوان وروابط، وأي رابط بدون مسار يتحول تلقائيًا لرابط الواتساب
            </AppCardDescription>
          </div>
          <AppButton size="sm" variant="outline" onClick={addGroup}>
            <Plus className="h-4 w-4" /> إضافة مجموعة
          </AppButton>
        </AppCardHeader>
        <AppCardContent className="space-y-5">
          {draft.groups.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              لا توجد مجموعات بعد. أضف مجموعة لتبدأ في ترتيب روابط الفوتر.
            </p>
          )}
          {draft.groups.map((group, gIndex) => (
            <div key={gIndex} className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <AppInput
                  value={group.heading}
                  onChange={(e) => updateGroup(gIndex, { heading: e.target.value })}
                  placeholder="عنوان المجموعة"
                  className="h-9"
                />
                <AppButton variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={gIndex === 0} onClick={() => moveGroup(gIndex, "up")} aria-label="تحريك لأعلى">
                  <span className="text-muted-foreground/70">↑</span>
                </AppButton>
                <AppButton variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={gIndex === draft.groups.length - 1} onClick={() => moveGroup(gIndex, "down")} aria-label="تحريك لأسفل">
                  <span className="text-muted-foreground/70">↓</span>
                </AppButton>
                <AppButton variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => removeGroup(gIndex)} aria-label="حذف المجموعة">
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              </div>
              <div className="mt-3 space-y-2 pl-6">
                {group.links.map((link, lIndex) => (
                  <div key={lIndex} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      {lIndex + 1}
                    </span>
                    <AppInput
                      value={link.label}
                      onChange={(e) => updateLink(gIndex, lIndex, { label: e.target.value })}
                      placeholder="النص"
                      className="h-8 w-40"
                    />
                    <AppInput
                      value={link.href}
                      dir="ltr"
                      onChange={(e) => updateLink(gIndex, lIndex, { href: e.target.value })}
                      placeholder="المسار الداخلي أو الرابط الكامل"
                      className="h-8 flex-1"
                    />
                    <AppButton variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => removeLink(gIndex, lIndex)} aria-label="حذف الرابط">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                ))}
                <AppButton variant="ghost" size="sm" className="mt-1" onClick={() => addLink(gIndex)}>
                  <Plus className="h-3.5 w-3.5" /> إضافة رابط
                </AppButton>
              </div>
            </div>
          ))}
        </AppCardContent>
      </AppCard>
    </div>
  );
}

function ContactTab({
  draft,
  setDraft,
}: {
  draft: FooterSettings;
  setDraft: (next: FooterSettings) => void;
}) {
  const setContact = (patch: Partial<FooterSettings["contact"]>) =>
    setDraft({ ...draft, contact: { ...draft.contact, ...patch } });

  return (
    <AppCard>
      <AppCardHeader>
        <AppCardTitle>بيانات التواصل</AppCardTitle>
        <AppCardDescription>
          معلومات الاتصال التي تظهر في شريط التواصل أسفل الفوتر
        </AppCardDescription>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        {[
          { key: "phone" as const, label: "رقم الهاتف", placeholder: "+20 10 1124 5565" },
          { key: "email" as const, label: "البريد الإلكتروني", placeholder: "hello@academy.example" },
          { key: "hours" as const, label: "ساعات العمل", placeholder: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً" },
        ].map((field) => (
          <div key={field.key}>
            <label className="mb-2 block text-sm font-medium">{field.label}</label>
            <AppInput
              dir="ltr"
              value={draft.contact[field.key]}
              onChange={(e) => setContact({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        ))}
        <div>
          <label className="mb-2 block text-sm font-medium">رقم الواتساب (مسار wa.me)</label>
          <AppInput
            dir="ltr"
            value={draft.contact.whatsapp}
            onChange={(e) => setContact({ whatsapp: e.target.value })}
            placeholder="201011245565"
          />
          <p className="mt-1 text-xs text-muted-foreground">أدخل الأرقام فقط بدون علامة + أو مسافات</p>
        </div>
      </AppCardContent>
    </AppCard>
  );
}

function SocialsTab({
  draft,
  setDraft,
}: {
  draft: FooterSettings;
  setDraft: (next: FooterSettings) => void;
}) {
  const setSocial = (patch: Partial<FooterSettings["socials"]>) =>
    setDraft({ ...draft, socials: { ...draft.socials, ...patch } });

  return (
    <AppCard>
      <AppCardHeader>
        <AppCardTitle>روابط التواصل الاجتماعي</AppCardTitle>
        <AppCardDescription>
          الروابط التي تظهر كأيقونات دائرية في الفوتر (يُظهر فقط الروابط غير الفارغة)
        </AppCardDescription>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        {[
          { key: "facebook" as const, label: "فيسبوك", placeholder: "https://facebook.com/..." },
          { key: "youtube" as const, label: "يوتيوب", placeholder: "https://youtube.com/..." },
          { key: "instagram" as const, label: "انستغرام", placeholder: "https://instagram.com/..." },
          { key: "whatsapp" as const, label: "رابط واتساب مخصص", placeholder: "https://wa.me/..." },
        ].map((field) => (
          <div key={field.key}>
            <label className="mb-2 block text-sm font-medium">{field.label}</label>
            <AppInput
              dir="ltr"
              value={draft.socials[field.key]}
              onChange={(e) => setSocial({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          الروابط الفارغة لن تظهر في الفوتر حتى تدخلها. احفظ ثم افتح الصفحة الرئيسية للمعاينة.
        </p>
      </AppCardContent>
    </AppCard>
  );
}

function FooterDraftEditor({ initial }: { initial: FooterSettings }) {
  const [draft, setDraft] = useState<FooterSettings>(() => cloneFooter(initial));
  const updateFooter = useUpdateFooterSettings();
  const saving = updateFooter.isPending;

  const onSave = () => {
    updateFooter.mutate(draft);
  };

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="محتوى الفوتر"
        description="إدارة نصوص المنصة، روابط التنقل، بيانات التواصل، وحسابات التواصل الاجتماعي"
      />
      <AppDivider className="mb-6" />

      <AppTabs defaultValue="content">
        <AppTabsList>
          <AppTabsTrigger value="content">
            <LinkIcon className="ml-1 h-3.5 w-3.5" /> المحتوى والروابط
          </AppTabsTrigger>
          <AppTabsTrigger value="contact">بيانات التواصل</AppTabsTrigger>
          <AppTabsTrigger value="socials">السوشيال ميديا</AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="content">
          <ContentTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>

        <AppTabsContent value="contact">
          <ContactTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>

        <AppTabsContent value="socials">
          <SocialsTab draft={draft} setDraft={setDraft} />
        </AppTabsContent>
      </AppTabs>

      <div className="mt-6 flex justify-end border-t border-border pt-6">
        <AppButton onClick={onSave} loading={saving}>
          حفظ محتوى الفوتر
        </AppButton>
      </div>
    </AppPage>
  );
}

export default function FooterSettingsPage() {
  const { data, isLoading } = useFooterSettings();

  return isLoading ? <AppLoadingState /> : <FooterDraftEditor initial={data} />;
}