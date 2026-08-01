"use client";

import { useState, useCallback } from "react";
import { Save, KeyRound, ShieldCheck, Globe, RefreshCcw } from "lucide-react";
import {
  AppPage, AppPageHeader, AppDivider, AppButton,
  AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent,
  AppInput, AppSelect, AppSelectItem, AppSwitch, AppLoadingState, AppErrorState,
} from "@/components/ui";
import { usePaymentGatewaySettings, useUpdatePaymentGateway } from "@/features/payments/hooks";

function PaymentGatewaySettingsPage() {
  const { data: settings, isLoading, isError, refetch } = usePaymentGatewaySettings();
  const updateSettings = useUpdatePaymentGateway();

  const [environment, setEnvironment] = useState<"test" | "live" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [activeToggled, setActiveToggled] = useState<boolean | null>(null);

  const activeEnv = environment ?? settings?.environment ?? "test";
  const isActive = activeToggled ?? settings?.is_active ?? false;

  const handleSave = useCallback(() => {
    updateSettings.mutate({
      provider: "fawaterk",
      environment: activeEnv,
      api_key: apiKey.trim() === "" ? null : apiKey.trim(),
      secret_key: secretKey.trim() === "" ? null : secretKey.trim(),
      is_active: isActive,
    });
    setApiKey("");
    setSecretKey("");
  }, [updateSettings, activeEnv, apiKey, secretKey, isActive]);

  const handleClear = useCallback(() => {
    setApiKey("");
    setSecretKey("");
    setEnvironment(null);
    setActiveToggled(null);
  }, []);

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="إعدادات بوابة الدفع"
        description="ربط بوابتك الخاصة بفواتيرك لتفعيل الشحن الإلكتروني للمحفظة"
      />
      <AppDivider className="mb-8" />

      <div className="space-y-8">
        {/* Activation */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>تفعيل البوابة</AppCardTitle>
            <AppCardDescription>
              فعّل البوابة بعد إدخال بيانات الاتصال الصحيحة
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">تفعيل الدفع الإلكتروني</p>
                  <p className="text-xs text-muted-foreground">
                    {isActive
                      ? "البوابة مفعّلة والطلاب يمكنهم الشحن أونلاين"
                      : "البوابة غير مفعّلة حالياً"}
                  </p>
                </div>
              </div>
              <AppSwitch checked={isActive} onCheckedChange={setActiveToggled} />
            </div>
          </AppCardContent>
        </AppCard>

        {/* Credentials */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>بيانات الاتصال بفواتيرك</AppCardTitle>
            <AppCardDescription>
              احصل على المفاتيح من حسابك في فواتيرك (لوحة التحكم ← المفاتيح)
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-5">
            {/* Environment */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                البيئة
              </label>
              <AppSelect value={activeEnv} onValueChange={(v) => setEnvironment(v as "test" | "live")}>
                <AppSelectItem value="test">وضع التجربة (Test)</AppSelectItem>
                <AppSelectItem value="live">وضع الإنتاج (Live)</AppSelectItem>
              </AppSelect>
              <p className="text-xs text-muted-foreground">
                استخدم وضع التجربة أثناء الاختبار، ثم بدّل إلى الإنتاج للدفع الحقيقي
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                مفتاح API
              </label>
              <AppInput
                type="password"
                dir="ltr"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.has_api_key ? settings.api_key_masked : "أدخل مفتاح API"}
                autoComplete="off"
              />
              {settings?.has_api_key && (
                <p className="text-xs text-muted-foreground">
                  لديك مفتاح محفوظ. اترك الحقل فارغاً للإبقاء عليه.
                </p>
              )}
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                المفتاح السري (Secret Key)
              </label>
              <AppInput
                type="password"
                dir="ltr"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={settings?.has_secret_key ? "••••••••••••" : "أدخل المفتاح السري"}
                autoComplete="off"
              />
              {settings?.has_secret_key && (
                <p className="text-xs text-muted-foreground">
                  لديك مفتاح سري محفوظ. اترك الحقل فارغاً للإبقاء عليه.
                </p>
              )}
            </div>
          </AppCardContent>
        </AppCard>

        {/* Info */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>كيف يعمل؟</AppCardTitle>
            <AppCardDescription>ملخص آلية الشحن الإلكتروني</AppCardDescription>
          </AppCardHeader>
          <AppCardContent>
            <ol className="list-decimal pr-5 space-y-2 text-sm text-muted-foreground">
              <li>الطالب يختار مبلغ الشحن من صفحة «شحن المحفظة أونلاين».</li>
              <li>يتم إنشاء فاتورة في فواتيرك وإعادة توجيه الطالب لصفحة الدفع.</li>
              <li>عند نجاح الدفع، يتم شحن المحفظة تلقائياً وتحديث الرصيد فوراً.</li>
              <li>يصل إشعار بالنجاح أو سبب الفشل للطالب.</li>
            </ol>
          </AppCardContent>
        </AppCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <AppButton variant="outline" onClick={handleClear}>
            مسح الحقول
          </AppButton>
          <AppButton onClick={handleSave} loading={updateSettings.isPending}>
            <Save className="h-4 w-4 ml-1" /> حفظ الإعدادات
          </AppButton>
        </div>
      </div>
    </AppPage>
  );
}

export default PaymentGatewaySettingsPage;
