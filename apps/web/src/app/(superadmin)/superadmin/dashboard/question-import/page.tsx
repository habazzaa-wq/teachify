"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Save, XCircle } from "lucide-react";
import { AppButton, AppCard, AppErrorState, AppInput, AppLoadingState, AppPage, AppPageHeader, AppSwitch } from "@/components/ui";
import { platformQuestionImportService, type QuestionImportHealth } from "@/features/platform-question-import/services";

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

export default function PlatformQuestionImportPage() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState<string>("");

  const tenantsQuery = useQuery({
    queryKey: ["platform-qi-tenants"],
    queryFn: () => platformQuestionImportService.listTenants(),
  });

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="استيراد الأسئلة بالذكاء البصري"
        description="فعّل مزوّد الذكاء البصري واضبط إعداداته لاستخراج الأسئلة من الصور لكل أكاديمية على حدة."
      />

      <AppCard className="mb-6 p-5">
        <label className="mb-1 block text-sm font-medium">الأكاديمية</label>
        <select
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          disabled={tenantsQuery.isLoading}
        >
          <option value="">اختر أكاديمية...</option>
          {(tenantsQuery.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </AppCard>

      {!tenantId ? (
        <AppCard className="p-6 text-sm text-muted-foreground">
          اختر أكاديمية لعرض وإدارة إعدادات استيراد الأسئلة بالذكاء البصري الخاصة بها.
        </AppCard>
      ) : (
        <TenantQuestionImportForm tenantId={tenantId} queryClient={queryClient} />
      )}
    </AppPage>
  );
}

function TenantQuestionImportForm({
  tenantId,
  queryClient,
}: {
  tenantId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const settingsQuery = useQuery({
    queryKey: ["platform-qi-settings", tenantId],
    queryFn: () => platformQuestionImportService.getSettings(tenantId),
  });

  const healthQuery = useQuery({
    queryKey: ["platform-qi-health", tenantId],
    queryFn: () => platformQuestionImportService.health(tenantId),
  });

  if (settingsQuery.isLoading) return <AppLoadingState />;
  if (settingsQuery.isError)
    return <AppErrorState onRetry={() => settingsQuery.refetch()} />;

  return (
    <QuestionImportForm
      tenantId={tenantId}
      initial={settingsQuery.data ?? {}}
      health={healthQuery.data ?? null}
      healthLoading={healthQuery.isFetching}
      onRefetchHealth={() => healthQuery.refetch()}
      queryClient={queryClient}
    />
  );
}

function QuestionImportForm({
  tenantId,
  initial,
  health,
  healthLoading,
  onRefetchHealth,
  queryClient,
}: {
  tenantId: string;
  initial: Record<string, unknown>;
  health: QuestionImportHealth | null;
  healthLoading: boolean;
  onRefetchHealth: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    enabled: initial.enabled === true,
    endpoint: (initial.endpoint as string) ?? "",
    api_key: (initial.api_key as string) ?? "",
    model: (initial.model as string) || DEFAULTS.model,
    timeout: Number(initial.timeout ?? DEFAULTS.timeout),
    daily_limit: Number(initial.daily_limit ?? DEFAULTS.daily_limit),
    rate_limit: Number(initial.rate_limit ?? DEFAULTS.rate_limit),
  }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values: Record<string, unknown> = {
        enabled: form.enabled,
        endpoint: form.endpoint,
        model: form.model,
        timeout: Number(form.timeout),
        daily_limit: Number(form.daily_limit),
        rate_limit: Number(form.rate_limit),
      };
      if (form.api_key.trim() !== "") {
        values.api_key = form.api_key;
      }
      await platformQuestionImportService.updateSettings(tenantId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-qi-settings", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["platform-qi-health", tenantId] });
    },
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    <>
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
            <AppButton variant="secondary" size="sm" onClick={onRefetchHealth}>
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
          <AppButton onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            <Save className="ml-1 h-4 w-4" /> حفظ الإعدادات
          </AppButton>
        </div>
      </AppCard>
    </>
  );
}
