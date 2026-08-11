"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  CreditCard,
  Loader2,
  ShoppingBag,
  TicketCheck,
  Wallet,
} from "lucide-react";
import { useWallet, useWalletTransactions } from "../../wallet/hooks";
import type { WalletTransaction } from "../../wallet/types";
import { RechargeWalletModal } from "../../wallet/components/RechargeWalletModal";
import { OnlineRechargeModal } from "../../wallet/components/OnlineRechargeModal";
import { useBrandTheme } from "./StudentCard";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
} from "../constants";
import { formatCurrency, formatDateTime, formatNumber, formatRechargeCode } from "@/lib/format";

interface MethodMeta {
  label: string;
  icon: LucideIcon;
  accent: string;
}

function methodMeta(tx: WalletTransaction): MethodMeta {
  const method = tx.method ?? "wallet_use";

  if (method === "recharge_code") {
    return { label: "كود شحن", icon: TicketCheck, accent: BRAND_SECONDARY };
  }
  if (method === "online") {
    return { label: "دفع إلكتروني", icon: CreditCard, accent: BRAND_PRIMARY };
  }
  return tx.type === "credit"
    ? { label: "استرداد", icon: Banknote, accent: BRAND_SECONDARY }
    : { label: "شراء دورة", icon: ShoppingBag, accent: BRAND_PRIMARY };
}

function providerLabel(provider: string | null | undefined): string {
  return provider === "fawaterk" ? "فوترك" : (provider ?? "بوابة الدفع");
}

function SkeletonRow({ t }: { t: ReturnType<typeof useBrandTheme> }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <div
        className="h-11 w-11 shrink-0 animate-pulse rounded-2xl"
        style={{ backgroundColor: t.divider }}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded-full" style={{ backgroundColor: t.divider }} />
        <div className="h-2 w-1/2 animate-pulse rounded-full" style={{ backgroundColor: t.divider }} />
      </div>
      <div className="h-4 w-16 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: t.divider }} />
    </div>
  );
}

export function WalletHistoryView() {
  const t = useBrandTheme();
  const { data: walletData } = useWallet(true);
  const { data, isLoading, isError, refetch } = useWalletTransactions(true, 100);

  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [onlineOpen, setOnlineOpen] = useState(false);

  const balance = Number(walletData?.balance ?? 0);
  const transactions = data?.data ?? [];

  let totalCredits = 0;
  let totalDebits = 0;
  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.type === "credit") {
      totalCredits += amount;
    } else {
      totalDebits += amount;
    }
  }

  return (
    <div>
      <SectionHeader
        index={5}
        eyebrow="محفظتك"
        title="سجل المحفظة"
        subtitle="كل إيداع وخصم من محفظتك — بكود شحن أو دفع إلكتروني."
        action={
          <span
            className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
            style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
          >
            {formatNumber(transactions.length)} عملية
          </span>
        }
      />

      {/* ─── Statement hero ─── */}
      <div
        className="relative mb-8 overflow-hidden rounded-[2rem] p-6 sm:p-8"
        style={{
          backgroundColor: t.isDark ? "#1c1a26" : "#fffdf8",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >
        <div
          className="pointer-events-none absolute -end-16 -top-20 h-64 w-64 rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND_SECONDARY}33, transparent 70%)` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -start-10 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND_PRIMARY}2e, transparent 70%)` }}
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                  color: BRAND_TEXT_ON_PRIMARY,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
                }}
              >
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: t.muted }}>
                الرصيد الحالي
              </span>
            </div>
            <p
              className="mt-3 text-4xl font-black tracking-tight tabular-nums sm:text-5xl"
              style={{ color: t.ink }}
            >
              <AnimatedNumber value={balance} suffix=" ج" />
            </p>
            <p className="mt-1.5 text-xs font-medium tabular-nums" style={{ color: t.faint }}>
              جنيه مصري
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRechargeOpen(true)}
              className="relative flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              }}
            >
              <span className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <TicketCheck className="h-4 w-4 relative z-10" aria-hidden="true" />
              <span className="relative z-10">شحن بالكود</span>
            </button>
            <button
              type="button"
              onClick={() => setOnlineOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: BRAND_SECONDARY,
                color: BRAND_SECONDARY,
                backgroundColor: t.isDark ? "rgba(255,181,14,0.08)" : "rgba(255,181,14,0.1)",
              }}
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              شحن أونلاين
            </button>
          </div>
        </div>

        <div
          className="relative my-6 h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${t.divider}, transparent)` }}
          aria-hidden="true"
        />

        <div className="relative grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold" style={{ color: t.muted }}>
              إجمالي الإيداع
            </p>
            <p className="mt-1 text-lg font-black tabular-nums" style={{ color: BRAND_PRIMARY }}>
              +{formatNumber(totalCredits)} ج
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold" style={{ color: t.muted }}>
              إجمالي الخصم
            </p>
            <p className="mt-1 text-lg font-black tabular-nums" style={{ color: t.muted }}>
              −{formatNumber(totalDebits)} ج
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold" style={{ color: t.muted }}>
              عدد العمليات
            </p>
            <p className="mt-1 text-lg font-black tabular-nums" style={{ color: t.ink }}>
              {formatNumber(transactions.length)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Ledger ─── */}
      <div
        className="overflow-hidden rounded-[1.5rem] border"
        style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: t.divider }}
        >
          <h3 className="text-[15px] font-extrabold" style={{ color: t.ink }}>
            العمليات الأخيرة
          </h3>
          {!isLoading && !isError && transactions.length > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold tabular-nums" style={{ color: t.faint }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND_PRIMARY }} aria-hidden="true" />
              آخر {formatNumber(transactions.length)} عملية
            </span>
          )}
        </div>

        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={i > 0 ? { borderTop: `1px solid ${t.divider}` } : undefined}>
                <SkeletonRow t={t} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p className="text-sm font-bold" style={{ color: t.ink }}>
              تعذّر تحميل السجل
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
              style={{ backgroundColor: BRAND_PRIMARY }}
            >
              <Loader2 className="h-4 w-4" aria-hidden="true" />
              إعادة المحاولة
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="لا توجد عمليات بعد"
            description="اشحن محفظتك بكود شحن أو عبر الدفع الإلكتروني ليظهر السجل هنا."
          />
        ) : (
          <ul>
            {transactions.map((tx, index) => {
              const { label, icon: Icon, accent } = methodMeta(tx);
              const isCredit = tx.type === "credit";
              const title = tx.description?.trim() || (isCredit ? "شحن المحفظة" : "خصم من المحفظة");

              return (
                <li
                  key={tx.id}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 sm:px-6"
                  style={index > 0 ? { borderTop: `1px solid ${t.divider}` } : undefined}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: isCredit ? accent : t.chipBg,
                      color: isCredit ? (accent === BRAND_SECONDARY ? "#17130d" : "#ffffff") : t.muted,
                      boxShadow: isCredit ? "0 6px 16px rgba(0,0,0,0.14)" : "none",
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold" style={{ color: t.ink }}>
                      {title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.divider}` }}
                      >
                        {label}
                      </span>
                      {tx.method === "recharge_code" && tx.recharge_code && (
                        <span className="font-mono text-[11px] font-bold tabular-nums tracking-wider" style={{ color: t.faint }} dir="ltr">
                          {formatRechargeCode(tx.recharge_code)}
                        </span>
                      )}
                      {tx.method === "online" && tx.payment?.reference && (
                        <span className="text-[11px] font-medium tabular-nums" style={{ color: t.faint }} dir="ltr">
                          {providerLabel(tx.payment.provider)} · {tx.payment.reference}
                        </span>
                      )}
                      <span className="text-[11px] font-medium tabular-nums" style={{ color: t.faint }}>
                        {formatDateTime(tx.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-end">
                    <p
                      className="text-base font-black tabular-nums"
                      style={{ color: isCredit ? BRAND_PRIMARY : t.muted }}
                    >
                      {isCredit ? "+" : "−"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium tabular-nums" style={{ color: t.faint }}>
                      الرصيد: {formatNumber(Number(tx.balance_after))} ج
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RechargeWalletModal open={rechargeOpen} onClose={() => setRechargeOpen(false)} />
      <OnlineRechargeModal open={onlineOpen} onClose={() => setOnlineOpen(false)} />
    </div>
  );
}
