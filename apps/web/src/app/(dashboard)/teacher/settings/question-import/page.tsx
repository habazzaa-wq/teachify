"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Save, XCircle } from "lucide-react";

import {
  AppButton,
  AppCard,
  AppDivider,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppPage,
  AppPageHeader,
  AppSwitch,
} from "@/components/ui";
import { useSettingsGroup, useUpdateSettingsGroup } from "@/features/settings/hooks";
import { examBankService } from "@/features/exam-bank/services";

type FormState = {
  enabled: boolean;
  endpoint: string;
  api_key: string;
  model: string;
  timeout: number;
  daily_limit: number;
  rate_limit: number;
};

const DEFAULTS: FormState = {
  enabled: false,
  endpoint: "",
  api_key: "",
  model: "gpt-4o-mini",
  timeout: 45,
  daily_limit: 50,
  rate_limit: 10,
};

export default function QuestionImportSettingsPage() {
  const { data, isLoading, isError, refetch } = useSettingsGroup("question_import");

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  return <QuestionImportForm initial={data ?? {}} />;
}

function QuestionImportForm({ initial }: { initial: Record<string, unknown> }) {
  const updateSettings = useUpdateSettingsGroup();

  const [form, setForm] = useState<FormState>(() => ({
    enabled: initial.enabled === true,
    endpoint: (initial.endpoint as string) ?? "",
    api_key: (initial.api_key as string) ?? "",
    model: (initial.model as string) || DEFAULTS.model,
    timeout: Number(initial.timeout ?? DEFAULTS.timeout),
    daily_limit: Number(initial.daily_limit ?? DEFAULTS.daily_limit),
    rate_limit: Number(initial.rate_limit ?? DEFAULTS.rate_limit),
  }));

  const healthQuery = useQuery({
    queryKey: ["question-import-health"],
    queryFn: () => examBankService.questionImportHealth(),
  });

  const health = healthQuery.data ?? null;
  const healthLoading = healthQuery.isFetching;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    const values: Record<string, unknown> = {
      enabled: form.enabled,
      endpoint: form.endpoint,
      model: form.model,
      timeout: Number(form.timeout),
      daily_limit: Number(form.daily_limit),
      rate_limit: Number(form.rate_limit),
    };
    // Only send the key when the teacher actually pasted a new one, so we
    // don't overwrite the stored secret with an empty field.
    if (form.api_key.trim() !== "") {
      values.api_key = form.api_key;
    }
    await updateSettings.mutateAsync({ group: "question_import", values });
    await healthQuery.refetch();
  };

  const healthLabel = healthLoading
    ? "جاري الفحص..."
    : health
      ? health.available
        ? "متصل وفعّال"
        : health.configured
          ? "مضبوط لكن غير متاح"
          : "غير مضبوط"
      : "—";

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="استيراد الأسئلة بالذكاء البصري"
        description="فعّل مزوّد الذكاء البصري واضبط إعداداته لاستخراج الأسئلة من الصور تلقائياً بدل الاستخراج المحلي."
      />
      <AppDivider className="mb-8" />

      <AppCard className="mb-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">حالة المزوّد</p>
            <p className="text-xs text-muted-foreground mt-1">{healthLabel}</p>
            {health?.reason ? (
              <p className="text-xs text-destructive mt-1">{health.reason}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : health?.available ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => healthQuery.refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> فحص
            </AppButton>
          </div>
        </div>
      </AppCard>

      <AppCard className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">تفعيل الذكاء البصري</p>
            <p className="text-xs text-muted-foreground mt-1">
              عند التفعيل يُستخدم المزوّد لاستخراج الأسئلة من الصور، وإلا يُستخدم
              الاستخراج المحلي (OCR).
            </p>
          </div>
          <AppSwitch
            checked={form.enabled}
            onCheckedChange={(value) => setField("enabled", value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">رابط المزوّد (Endpoint)</label>
          <AppInput
            className="text-left"
            dir="ltr"
            value={form.endpoint}
            onChange={(e) => setField("endpoint", e.target.value)}
            placeholder="https://api.openai.com/v1/chat/completions"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">مفتاح الـ API</label>
          <AppInput
            className="text-left"
            dir="ltr"
            type="password"
            value={form.api_key}
            onChange={(e) => setField("api_key", e.target.value)}
            placeholder={initial.api_key ? "•••••••• (اتركه كما هو أو بدّله)" : "ألصق المفتاح هنا"}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            يُخزّن في إعدادات الأكاديمية ولا يظهر لغيرك. اتركه فارغاً لتبقى القيمة
            كما هي.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">الموديل (Model)</label>
          <AppInput
            className="text-left"
            dir="ltr"
            value={form.model}
            onChange={(e) => setField("model", e.target.value)}
            placeholder="gpt-4o-mini"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">مهلة الاستجابة (ث)</label>
            <AppInput
              className="text-left"
              dir="ltr"
              type="number"
              value={String(form.timeout)}
              onChange={(e) => setField("timeout", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الحد اليومي</label>
            <AppInput
              className="text-left"
              dir="ltr"
              type="number"
              value={String(form.daily_limit)}
              onChange={(e) => setField("daily_limit", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الحد المروري</label>
            <AppInput
              className="text-left"
              dir="ltr"
              type="number"
              value={String(form.rate_limit)}
              onChange={(e) => setField("rate_limit", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <AppButton onClick={() => save()} loading={updateSettings.isPending}>
            <Save className="ml-1 h-4 w-4" /> حفظ الإعدادات
          </AppButton>
        </div>
      </AppCard>
    </AppPage>
  );
}
