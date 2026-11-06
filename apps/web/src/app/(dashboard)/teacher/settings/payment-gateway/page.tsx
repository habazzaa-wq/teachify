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
  const needsCurrencyConversion = isPayPal || isPaymob;
  const [environment, setEnvironment] = useState<"test" | "live" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [integrationId, setIntegrationId] = useState(settings.integration_id ?? "");
  const [iframeId, setIframeId] = useState(settings.iframe_id ?? "");
  const [currency, setCurrency] = useState(settings.currency ?? (isPaymob ? "EGP" : "USD"));
  const [exchangeRate, setExchangeRate] = useState(
    settings.exchange_rate == null ? "" : String(settings.exchange_rate),
  );
  const regionalCurrencies = isPaymob
    ? ["SAR", "AED", "KWD", "QAR", "BHD", "USD", "EUR"]
    : ["KWD", "QAR", "BHD"];
  const [exchangeRates, setExchangeRates] = useState<Record<string, string>>({
    ...Object.fromEntries(regionalCurrencies.map((code) => [
      code,
      settings.exchange_rates?.[code] == null ? "" : String(settings.exchange_rates[code]),
    ])),
  });
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
            currency,
            exchange_rate: exchangeRate.trim() ? Number(exchangeRate) : null,
            exchange_rates: Object.fromEntries(
              Object.entries(exchangeRates).map(([code, rate]) => [code, rate.trim() ? Number(rate) : null]),
            ),
          }
        : isPaymob
          ? {
              api_key: apiKey.trim() || null,
              hmac_secret: secretKey.trim() || null,
              integration_id: integrationId.trim() ? Number(integrationId) : undefined,
              iframe_id: iframeId.trim() ? Number(iframeId) : undefined,
              currency,
              exchange_rate: exchangeRate.trim() ? Number(exchangeRate) : null,
              exchange_rates: Object.fromEntries(
                Object.entries(exchangeRates).map(([code, rate]) => [code, rate.trim() ? Number(rate) : null]),
              ),
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
  }, [activeEnvironment, apiKey, currency, exchangeRate, exchangeRates, integrationId, iframeId, isActive, isPayPal, isPaymob, provider, secretKey, updateSettings]);

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

        {needsCurrencyConversion && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isPaymob ? "عملة تكامل Paymob" : "عملة استقبال مبالغ الجنيه المصري"}
              </label>
              <AppSelect value={currency} onValueChange={setCurrency}>
                <AppSelectTrigger>
                  <AppSelectValue placeholder="اختر العملة" />
                </AppSelectTrigger>
                <AppSelectContent>
                  {(isPaymob ? ["EGP", "USD", "EUR", "SAR", "AED"] : ["USD", "EUR", "GBP", "SAR", "AED", "CAD", "AUD"]).map((item) => (
                    <AppSelectItem key={item} value={item}>{item}</AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>
            <div className="space-y-2">
              <label htmlFor={`${provider}-egp-rate`} className="text-sm font-medium">
                سعر التحويل من الجنيه المصري إلى {currency}
              </label>
              <AppInput
                id={`${provider}-egp-rate`}
                type="number"
                inputMode="decimal"
                min="0.000001"
                step="any"
                dir="ltr"
                value={exchangeRate}
                onChange={(event) => setExchangeRate(event.target.value)}
                placeholder="مثال: 0.02 أو 52"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                اكتب عدد {currency} لكل جنيه مصري (مثلاً 0.02)، أو عدد الجنيهات لكل 1 {currency}
                (مثلاً 52). عند اختيار EGP لا يلزم سعر تحويل.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">سعر تحويل عملات التسعير الإقليمي إلى {currency}</p>
              {regionalCurrencies.map((code) => (
                <div key={code} className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <label htmlFor={`${provider}-rate-${code}`} className="text-sm text-muted-foreground">{code}</label>
                  <AppInput
                    id={`${provider}-rate-${code}`}
                    type="number"
                    inputMode="decimal"
                    min="0.000001"
                    step="any"
                    dir="ltr"
                    value={exchangeRates[code]}
                    onChange={(event) => setExchangeRates((rates) => ({ ...rates, [code]: event.target.value }))}
                    placeholder={`1 ${code} = ${currency}`}
                  />
                </div>
              ))}
            </div>
            <p className="rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
              {isPayPal
                ? "نتحقق من بيانات PayPal عند التفعيل، ويظهر للطالب المبلغ بعملة PayPal قبل المتابعة."
                : "نتحقق من مفتاح API عند التفعيل، ويظهر للطالب المبلغ بعملة تكامل Paymob قبل المتابعة."}
            </p>
          </>
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
