"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Scale, Plus, Trash2, ChevronUp, ChevronDown, ShieldCheck } from "lucide-react";
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
  AppLoadingState,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
} from "@/components/ui";
import {
  useLegalSettings,
  useUpdateLegalSettings,
} from "@/features/legal/hooks";
import { mergeLegalSettings, type LegalContent, type LegalDocumentType } from "@/features/legal/types";
import { routes } from "@/constants/routes";

function LegalDraftEditor({ initial }: { initial: ReturnType<typeof mergeLegalSettings> }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab: LegalDocumentType = searchParams.get("tab") === "terms" ? "terms" : "privacy";
  const [draft, setDraft] = useState(() => ({
    privacy: { ...initial.privacy, sections: initial.privacy.sections.map((s) => ({ ...s })) },
    terms: { ...initial.terms, sections: initial.terms.sections.map((s) => ({ ...s })) },
  }));

  const updateLegal = useUpdateLegalSettings();
  const content = draft[tab];
  const saving = updateLegal.isPending;

  const setContent = (next: LegalContent) => {
    setDraft({ ...draft, [tab]: next });
  };

  const onSave = () => {
    if (!content.title.trim()) return;
    const updatedAt = new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    updateLegal.mutate({ type: tab, content: { ...content, updatedAt } });
  };

  const updateSection = (index: number, patch: Partial<{ heading: string; body: string }>) => {
    setContent({
      ...content,
      sections: content.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const addSection = () => {
    setContent({
      ...content,
      sections: [...content.sections, { heading: "", body: "" }],
    });
  };

  const removeSection = (index: number) => {
    setContent({
      ...content,
      sections: content.sections.filter((_, i) => i !== index),
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= content.sections.length) return;
    const sections = [...content.sections];
    const a = sections[index];
    const b = sections[nextIndex];
    if (a === undefined || b === undefined) return;
    sections[index] = b;
    sections[nextIndex] = a;
    setContent({ ...content, sections });
  };

  const switchTab = (value: string) => {
    router.replace(`${routes.teacherLegal}?tab=${value}`, { scroll: false });
  };

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="الصفحات القانونية"
        description="إدارة محتوى سياسة الخصوصية وشروط الاستخدام المعروضة في الفوتر"
      />
      <AppDivider className="mb-6" />

      <AppTabs value={tab} onValueChange={switchTab}>
        <AppTabsList>
          <AppTabsTrigger value="privacy" className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            سياسة الخصوصية
          </AppTabsTrigger>
          <AppTabsTrigger value="terms" className="inline-flex items-center gap-2">
            <Scale className="h-4 w-4" />
            شروط الاستخدام
          </AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value={tab}>
          <div className="space-y-6">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>عنوان الصفحة وتفعيلها</AppCardTitle>
                <AppCardDescription>
                  العنوان يظهر في أعلى الصفحة وفي نتائج البحث
                </AppCardDescription>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    عنوان الصفحة <span className="text-destructive">*</span>
                  </label>
                  <AppInput
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    placeholder={tab === "privacy" ? "سياسة الخصوصية" : "شروط الاستخدام"}
                  />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div>
                    <span className="text-sm font-medium">تفعيل الصفحة</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      إظهار الصفحة للزوار عبر رابطها المباشر
                    </p>
                  </div>
                  <AppSwitch
                    checked={content.isActive}
                    onCheckedChange={(v) => setContent({ ...content, isActive: v })}
                  />
                </label>
                {content.updatedAt && (
                  <p className="text-[13px] text-muted-foreground">
                    آخر تحديث: <span className="text-foreground/80">{content.updatedAt}</span>
                  </p>
                )}
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader className="flex-row items-center justify-between">
                <div>
                  <AppCardTitle>الأقسام ({content.sections.length})</AppCardTitle>
                  <AppCardDescription>
                    كل قسم له عنوان وفقرة نصية، ويمكنك إعادة ترتيبها أو حذفها
                  </AppCardDescription>
                </div>
                <AppButton size="sm" variant="outline" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                  إضافة قسم
                </AppButton>
              </AppCardHeader>
              <AppCardContent className="space-y-4">
                {content.sections.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                    لا توجد أقسام بعد. أضف قسمًا لتبدأ في كتابة محتوى الصفحة.
                  </p>
                )}
                {content.sections.map((section, index) => (
                  <div key={index} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <AppButton
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => moveSection(index, "up")}
                          aria-label="تحريك لأعلى"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </AppButton>
                        <AppButton
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === content.sections.length - 1}
                          onClick={() => moveSection(index, "down")}
                          aria-label="تحريك لأسفل"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </AppButton>
                      </div>
                      <AppButton
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeSection(index)}
                        aria-label="حذف القسم"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AppButton>
                    </div>
                    <div className="mt-3 space-y-3">
                      <AppInput
                        value={section.heading}
                        onChange={(e) => updateSection(index, { heading: e.target.value })}
                        placeholder="عنوان القسم"
                      />
                      <AppTextarea
                        value={section.body}
                        onChange={(e) => updateSection(index, { body: e.target.value })}
                        placeholder="نص الفقرة"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </AppCardContent>
            </AppCard>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                رابط الصفحة:{" "}
                <span className="font-mono text-foreground/70" dir="ltr">
                  {tab === "privacy" ? "/privacy" : "/terms"}
                </span>
              </p>
              <AppButton onClick={onSave} loading={saving} disabled={!content.title.trim()}>
                <FileText className="h-4 w-4" />
                حفظ الصفحة
              </AppButton>
            </div>
          </div>
        </AppTabsContent>
      </AppTabs>
    </AppPage>
  );
}

export default function LegalSettingsPage() {
  const { data, isLoading } = useLegalSettings();
  const merged = useMemo(() => mergeLegalSettings(data), [data]);

  return (
    <Suspense fallback={<AppLoadingState />}>
      {isLoading ? (
        <AppLoadingState />
      ) : (
        <LegalDraftEditor initial={merged} />
      )}
    </Suspense>
  );
}