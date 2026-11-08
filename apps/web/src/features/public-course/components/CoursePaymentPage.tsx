"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CreditCard,
  Globe2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuthStatus";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAvailablePaymentGateways } from "@/features/payments/hooks";
import type { PaymentProvider } from "@/features/payments/types";
import { useCreateDirectCoursePayment, useDirectCoursePaymentQuote, usePublicCourse } from "../hooks";
import { formatCoursePrice, PAYPAL_SUPPORTED_CURRENCIES } from "../utils";
import { PRIMARY, CTA_GRADIENT } from "../brand";
import { Skeleton } from "@/components/ui/Skeleton";
import { PublicLoginCard } from "@/features/auth/components/PublicLoginCard";
import type { PublicCourse } from "../types";

interface CoursePaymentPageProps {
  slug: string;
  initialCourse: PublicCourse;
}

const providerDetails: Record<PaymentProvider, { label: string; description: string }> = {
  fawaterk: {
    label: "فواتيرك",
    description: "ادفع باستخدام وسائل الدفع المحلية المتاحة في بلدك.",
  },
  paypal: {
    label: "PayPal",
    description: "أكمل الدفع بأمان عبر PayPal أو البطاقة المتاحة في حسابك.",
  },
  paymob: {
    label: "Paymob",
    description: "ادفع ببطاقات Visa وMastercard، حسب وسائل الدفع المفعّلة لدى الأكاديمية.",
  },
};

export function CoursePaymentPage({ slug, initialCourse }: CoursePaymentPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();
  const { tenant } = useActiveTenant();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [paypalCurrency, setPaypalCurrency] = useState("USD");
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: fetchedCourse, isLoading: courseLoading } = usePublicCourse(slug);
  const course = fetchedCourse ?? initialCourse;
  const isRegionalCheckoutEnabled =
    tenant?.feature_flags?.has_wallet === false
    && tenant.feature_flags.has_regional_pricing === true;

  const {
    data: providers = [],
    isLoading: providersLoading,
    isError: providersError,
  } = useAvailablePaymentGateways(isAuthenticated && isRegionalCheckoutEnabled);
  const directPayment = useCreateDirectCoursePayment(slug);
  const activeProvider = selectedProvider && providers.includes(selectedProvider)
    ? selectedProvider
    : providers[0] ?? null;
  const quote = useDirectCoursePaymentQuote(
    slug,
    activeProvider,
    isAuthenticated && isRegionalCheckoutEnabled,
    activeProvider === "paypal" ? paypalCurrency : undefined,
  );

  useEffect(() => {
    if (!isAuthenticated) setLoginOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (tenant && !isRegionalCheckoutEnabled) {
      router.replace(`/courses/${slug}`);
    }
  }, [isRegionalCheckoutEnabled, router, slug, tenant]);

  if ((courseLoading && !fetchedCourse) || !course) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-muted/20 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/courses/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى الدورة
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold" style={{ color: PRIMARY }}>إتمام الاشتراك</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            اختر طريقة الدفع المناسبة
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            اختر بوابة الدفع الآمنة التي تفضلها لإتمام شراء الدورة.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">بوابات الدفع المتاحة</h2>
                <p className="mt-1 text-sm text-muted-foreground">حدد البوابة التي تريد الدفع من خلالها</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>

            {providersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            ) : providersError ? (
              <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                تعذر تحميل بوابات الدفع. أعد تحميل الصفحة وحاول مرة أخرى.
              </div>
            ) : providers.length === 0 ? (
              <div role="status" className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                لا توجد بوابة دفع مفعّلة لهذه الأكاديمية حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => {
                  const selected = activeProvider === provider;
                  const details = providerDetails[provider];
                  const ProviderIcon = provider === "paypal" ? Globe2 : CreditCard;

                  return (
                    <button
                      key={provider}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedProvider(provider)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-start transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/15"
                          : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <ProviderIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-foreground">{details.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                          {details.description}
                        </span>
                      </span>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}>
                        {selected && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeProvider === "paypal" && (
              <div className="mt-5">
                <label htmlFor="paypal-currency" className="mb-2 block text-sm font-semibold text-foreground">
                  اختر عملة حساب PayPal
                </label>
                <select
                  id="paypal-currency"
                  value={paypalCurrency}
                  onChange={(event) => setPaypalCurrency(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {(quote.data?.paypalCurrencies.length ? quote.data.paypalCurrencies : PAYPAL_SUPPORTED_CURRENCIES).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            )}

            {directPayment.error && (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {directPayment.error instanceof Error
                  ? directPayment.error.message
                  : "تعذر بدء عملية الدفع. حاول مرة أخرى."}
              </p>
            )}

            <button
              type="button"
              onClick={() => activeProvider && directPayment.mutate({
                provider: activeProvider,
                ...(activeProvider === "paypal" ? { paypalCurrency } : {}),
              })}
              disabled={!activeProvider || providersLoading || providersError || directPayment.isPending || quote.isLoading || quote.isError}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: CTA_GRADIENT }}
            >
              {directPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {directPayment.isPending ? "جارٍ تجهيز الدفع..." : "المتابعة إلى الدفع الآمن"}
            </button>

            {["paypal", "paymob"].includes(activeProvider ?? "") && quote.data?.gatewayEnvironment === "test" && (
              <p role="status" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                أنت تستخدم بيئة الاختبار. استخدم بيانات الدفع التجريبية التي توفرها بوابة الدفع؛
                معاملات الاختبار لا تخصم أموالاً حقيقية.
              </p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              بيانات الدفع تُعالج بأمان عبر بوابة الدفع المختارة.
            </div>
          </section>

          <aside className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <div
              className="flex aspect-[16/8] items-center justify-center bg-cover bg-center"
              style={course.coverImage || course.thumbnail
                ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.02)), url("${course.coverImage || course.thumbnail}")` }
                : { background: CTA_GRADIENT }}
            >
              {!course.coverImage && !course.thumbnail && <BookOpen className="h-10 w-10 text-white/80" />}
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-muted-foreground">ملخص الطلب</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-bold text-foreground">{course.title}</h2>
              <div className="my-4 border-t border-border/60" />

              {quote.isLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : quote.isError ? (
                <div role="alert" className="space-y-2 text-sm text-destructive">
                  <p>
                    {quote.error instanceof Error
                      ? quote.error.message
                      : "تعذر تحديد السعر لبلدك. أعد المحاولة."}
                  </p>
                  <button type="button" onClick={() => void quote.refetch()} className="font-semibold underline">
                    إعادة المحاولة
                  </button>
                </div>
              ) : quote.data ? (
                <>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">بلد التسعير</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Globe2 className="h-4 w-4 text-muted-foreground" />
                      {quote.data.countryName}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      {activeProvider === "paypal" ? "سعر الدورة" : "المبلغ المطلوب"}
                    </span>
                    <span className="text-xl font-extrabold text-foreground">
                      {formatCoursePrice(quote.data.amount, quote.data.currency)}
                    </span>
                  </div>
                  {activeProvider === "paypal" && quote.data.gatewayAmount && quote.data.gatewayCurrency && (
                    <div className="mt-4 rounded-xl bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">المبلغ المطلوب عبر PayPal</span>
                        <span className="text-lg font-extrabold text-foreground">
                          {formatCoursePrice(quote.data.gatewayAmount, quote.data.gatewayCurrency)}
                        </span>
                      </div>
                      {quote.data.gatewayExchangeRate && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          سعر التحويل: 1 {quote.data.currency === "SR" ? "SAR" : quote.data.currency} = {quote.data.gatewayExchangeRate} {quote.data.gatewayCurrency}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                السعر محسوب تلقائياً حسب بلدك، وسيتم تحويلك إلى البوابة المختارة لإتمام العملية.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <PublicLoginCard
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          router.replace(`/courses/${slug}`);
        }}
        onSuccess={() => setLoginOpen(false)}
      />
    </main>
  );
}
