"use client";

import { useCallback, useState } from "react";
import { CreditCard, KeyRound, Save, ShieldCheck } from "lucide-react";
import {
  AppPage, AppPageHeader, AppDivider, AppButton,
  AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent,
  AppInput, AppSelect, AppSelectValue, AppSelectTrigger, AppSelectContent,
  AppSelectItem, AppSwitch, AppLoadingState, AppErrorState,
} from "@/components/ui";
import { usePaymentGatewaySettings, useUpdatePaymentGateway } from "@/features/payments/hooks";
import type { GatewaySettings, PaymentProvider } from "@/features/payments/types";

interface GatewayCardProps {
  provider: PaymentProvider;
  settings: GatewaySettings;
}

function GatewayCard({ provider, settings }: GatewayCardProps) {
  const updateSettings = useUpdatePaymentGateway();
  const isPayPal = provider === "paypal";
  const isPaymob = provider === "paymob";
  const [environment, setEnvironment] = useState<"test" | "live" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [integrationId, setIntegrationId] = useState(settings.integration_id ?? "");
  const [iframeId, setIframeId] = useState(settings.iframe_id ?? "");
  const [activeToggled, setActiveToggled] = useState<boolean | null>(null);
  const activeEnvironment = environment ?? settings.environment ?? "test";
  const isActive = activeToggled ?? settings.is_active;

  const handleSave = useCallback(() => {
    updateSettings.mutate({
      provider,
      environment: activeEnvironment,
      is_active: isActive,
      ...(isPayPal
        ? {
            client_id: apiKey.trim() || null,
            client_secret: secretKey.trim() || null,
          }
        : isPaymob
          ? {
              api_key: apiKey.trim() || null,
              hmac_secret: secretKey.trim() || null,
              integration_id: integrationId.trim() ? Number(integrationId) : undefined,
              iframe_id: iframeId.trim() ? Number(iframeId) : undefined,
            }
        : {
            api_key: apiKey.trim() || null,
            secret_key: secretKey.trim() || null,
          }),
    }, {
      onSuccess: () => {
        setApiKey("");
        setSecretKey("");
      },
    });
  }, [activeEnvironment, apiKey, integrationId, iframeId, isActive, isPayPal, isPaymob, provider, secretKey, updateSettings]);

  const hasFirstCredential = isPayPal ? settings.has_client_id : settings.has_api_key;
  const firstCredentialPlaceholder = isPayPal
    ? settings.client_id_masked || "أدخل Client ID"
    : settings.api_key_masked || "أدخل مفتاح API";
  const title = isPayPal ? "PayPal" : isPaymob ? "Paymob" : "فواتيرك";

  return (
    <AppCard>
      <AppCardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <AppCardTitle>{title}</AppCardTitle>
            <AppCardDescription>
              {isPayPal
                ? "اربط حساب PayPal التجاري لاستقبال مدفوعات الطلاب مباشرةً."
                : isPaymob
                  ? "اربط حساب Paymob لقبول مدفوعات البطاقات، بما فيها البطاقات الدولية عند تفعيلها في حسابك."
                  : "اربط حساب فواتيرك لاستقبال مدفوعات الطلاب."}
            </AppCardDescription>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">تفعيل {title}</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? "متاحة للطلاب عند الدفع" : "غير مفعّلة حالياً"}
              </p>
            </div>
          </div>
          <AppSwitch checked={isActive} onCheckedChange={setActiveToggled} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">بيئة الاتصال</label>
          <AppSelect value={activeEnvironment} onValueChange={(value) => setEnvironment(value as "test" | "live")}>
            <AppSelectTrigger>
              <AppSelectValue placeholder="اختر البيئة" />
            </AppSelectTrigger>
            <AppSelectContent>
              <AppSelectItem value="test">تجريبية (Sandbox / Test)</AppSelectItem>
              <AppSelectItem value="live">إنتاج (Live)</AppSelectItem>
            </AppSelectContent>
          </AppSelect>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            {isPayPal ? "Client ID" : "مفتاح API"}
          </label>
          <AppInput
            type="password"
            dir="ltr"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={firstCredentialPlaceholder}
            autoComplete="new-password"
          />
          {hasFirstCredential && (
            <p className="text-xs text-muted-foreground">
              بيانات محفوظة. اترك الحقل فارغاً للاحتفاظ بها.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            {isPayPal ? "Client Secret" : isPaymob ? "HMAC Secret" : "المفتاح السري"}
          </label>
          <AppInput
            type="password"
            dir="ltr"
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder={
              isPayPal
                ? settings.has_client_secret ? "••••••••••••" : "أدخل Client Secret"
                : isPaymob
                  ? settings.has_hmac_secret ? "••••••••••••" : "أدخل HMAC Secret"
                  : settings.has_secret_key ? "••••••••••••" : "أدخل المفتاح السري"
            }
            autoComplete="new-password"
          />
          {(isPayPal ? settings.has_client_secret : isPaymob ? settings.has_hmac_secret : settings.has_secret_key) && (
            <p className="text-xs text-muted-foreground">
              المفتاح السري محفوظ بشكل مشفّر. اترك الحقل فارغاً للاحتفاظ به.
            </p>
          )}
        </div>

        {isPaymob && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="paymob-integration-id" className="text-sm font-medium">Card Integration ID</label>
                <AppInput
                  id="paymob-integration-id"
                  type="number"
                  min="1"
                  step="1"
                  dir="ltr"
                  value={integrationId}
                  onChange={(event) => setIntegrationId(event.target.value)}
                  placeholder="رقم تكامل البطاقات"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="paymob-iframe-id" className="text-sm font-medium">Iframe ID</label>
                <AppInput
                  id="paymob-iframe-id"
                  type="number"
                  min="1"
                  step="1"
                  dir="ltr"
                  value={iframeId}
                  onChange={(event) => setIframeId(event.target.value)}
                  placeholder="رقم صفحة الدفع"
                />
              </div>
            </div>
            <p className="rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
              أدخل API Key وHMAC Secret وCard Integration ID وIframe ID من لوحة Paymob، واختر البيئة المطابقة
              لبيانات التكامل. لقبول Visa أو Mastercard الدولية،
              تأكد من تفعيلها لحسابك لدى Paymob؛ إتاحة البطاقات الدولية تخضع لموافقة وإعدادات حساب التاجر.
            </p>
          </>
        )}

        {(isPayPal || isPaymob) && (
          <p className="rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
            يدفع الطالب بنفس المبلغ والعملة المحددين لسعر الدورة. تأكد من أن حسابك وتكامل البوابة يدعمان عملة السعر؛
            قد ترفض البوابة العملية إذا لم تكن العملة مفعّلة لحساب التاجر.
          </p>
        )}

        <div className="flex justify-end">
          <AppButton onClick={handleSave} loading={updateSettings.isPending}>
            <Save className="ml-1 h-4 w-4" /> حفظ إعدادات {title}
          </AppButton>
        </div>
      </AppCardContent>
    </AppCard>
  );
}

function PaymentGatewaySettingsPage() {
  const { data: settings, isLoading, isError, refetch } = usePaymentGatewaySettings();

  if (isLoading) return <AppLoadingState />;
  if (isError || !settings) return <AppErrorState onRetry={() => refetch()} />;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="بوابات الدفع"
        description="اربط بوابات الدفع الخاصة بأكاديميتك واختر ما تريد إتاحته للطلاب."
      />
      <AppDivider className="mb-8" />

      <div className="space-y-6">
        <GatewayCard provider="fawaterk" settings={settings.fawaterk} />
        <GatewayCard provider="paypal" settings={settings.paypal} />
        <GatewayCard provider="paymob" settings={settings.paymob} />
      </div>
    </AppPage>
  );
}

export default PaymentGatewaySettingsPage;
