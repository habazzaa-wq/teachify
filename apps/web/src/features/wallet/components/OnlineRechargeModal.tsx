"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Loader2,
  Banknote,
  ShieldCheck,
  CreditCard,
  X,
} from "lucide-react";
import { useCreateOnlinePayment, useWallet } from "../hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

const primary = "var(--brand-primary)";
const secondary = "var(--brand-secondary)";

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;

interface OnlineRechargeModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnlineRechargeModal({ open, onClose }: OnlineRechargeModalProps) {
  const createPayment = useCreateOnlinePayment();
  const { data: walletData } = useWallet(true);

  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const balance = walletData?.balance ?? 0;

  const resetForm = useCallback(() => {
    setAmount("");
    setError(null);
    setBusy(false);
  }, []);

  const selectPreset = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const handleCustomChange = (value: string) => {
    if (value === "") {
      setAmount("");
    } else {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        setAmount(parsed);
      }
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount < MIN_AMOUNT) {
      setError(`يرجى إدخال مبلغ لا يقل عن ${MIN_AMOUNT} جنيه.`);
      return;
    }
    if (numericAmount > MAX_AMOUNT) {
      setError(`الحد الأقصى للمبلغ هو ${MAX_AMOUNT.toLocaleString("ar-EG")} جنيه.`);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const result = await createPayment.mutateAsync(numericAmount);
      // Redirect to the payment gateway to complete the transaction.
      window.location.assign(result.data.payment_url);
    } catch (err: unknown) {
      setBusy(false);
      const apiErr = err as { status?: number; message?: string; fieldErrors?: Record<string, string[]> };
      let msg = apiErr?.message ?? "حدث خطأ غير متوقع. حاول مرة أخرى.";
      if (apiErr?.fieldErrors?.amount) {
        msg = Array.isArray(apiErr.fieldErrors.amount)
          ? (apiErr.fieldErrors.amount[0] ?? msg)
          : String(apiErr.fieldErrors.amount);
      }
      setError(msg);
    }
  };

  const handleClose = useCallback(() => {
    if (busy) return;
    resetForm();
    onClose();
  }, [busy, onClose, resetForm]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed z-[100] inset-x-0 inset-y-0 m-auto w-[calc(100vw-2rem)] max-w-lg h-fit max-h-[90vh] rounded-3xl border border-border/40 bg-card shadow-2xl shadow-black/10 flex flex-col overflow-hidden"
            style={{ boxShadow: `0 25px 60px -12px rgba(0,0,0,0.145), 0 0 0 1px rgba(0,0,0,0.063)` }}
            role="dialog"
            aria-modal="true"
            aria-label="شحن المحفظة أونلاين"
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
              style={{ background: `var(--brand-primary)` }}
            />

            <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
              <div className="mb-5 text-center">
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: `var(--brand-primary)`,
                    boxShadow: `0 4px 16px rgba(0,0,0,0.251)`,
                  }}
                >
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-base font-bold text-foreground">شحن المحفظة أونلاين</h2>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  اختر المبلغ وستتم إعادة توجيهك إلى بوابة الدفع لإتمام العملية
                </p>
              </div>

              {/* Current balance */}
              <div
                className="mb-5 flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  border: `1px solid var(--brand-secondary)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" style={{ color: primary }} />
                  <span className="text-xs text-muted-foreground/70">رصيدك الحالي</span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(balance)}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Preset amounts */}
                <div>
                  <label className="text-xs font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground/50" />
                    المبلغ المطلوب
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRESET_AMOUNTS.map((value) => {
                      const selected = amount === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => selectPreset(value)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-semibold transition-all duration-200",
                            selected
                              ? "text-white border-transparent"
                              : "border-border/50 bg-background/80 text-foreground/80 hover:border-primary/40",
                          )}
                          style={
                            selected
                              ? {
                                  background: `var(--brand-primary)`,
                                  boxShadow: `0 4px 14px rgba(0,0,0,0.251)`,
                                }
                              : undefined
                          }
                        >
                          {value.toLocaleString("ar-EG")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom amount */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground/50" />
                    مبلغ مخصص
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      dir="ltr"
                      inputMode="numeric"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step="0.01"
                      value={amount === "" ? "" : String(amount)}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      placeholder="أدخل المبلغ بالجنيه"
                      disabled={busy}
                      className={cn(
                        "h-11 w-full rounded-xl border bg-background/80 px-3 text-sm transition-all duration-200 text-right",
                        "placeholder:text-muted-foreground/35",
                        "focus:outline-none focus:ring-2 focus:ring-offset-1",
                        error
                          ? "border-red-400 focus:ring-red-400/30"
                          : "border-border/50 focus:ring-primary/20 focus:border-primary/50",
                      )}
                    />
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
                      ج.م
                    </span>
                  </div>
                  {amount !== "" && Number(amount) > 0 && (
                    <p className="text-[11px] text-muted-foreground/50">
                      سيتم خصم المبلغ منك: <span className="font-semibold">{formatCurrency(Number(amount))}</span>
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                  </motion.div>
                )}

                <div className="flex items-center gap-2 justify-center pt-1">
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: secondary }} />
                  <p className="text-[11px] text-muted-foreground/50">
                    الدفع مشفّر وآمن عبر بوابة فواتيرك
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="relative flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60 group overflow-hidden"
                    style={{
                      background: `var(--brand-primary)`,
                      boxShadow: `0 4px 16px rgba(0,0,0,0.251)`,
                    }}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                    ) : (
                      <CreditCard className="h-4 w-4 relative z-10" />
                    )}
                    <span className="relative z-10">
                      {busy ? "جارٍ إنشاء رابط الدفع..." : "متابعة"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={busy}
                    className="h-11 px-5 rounded-xl text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              aria-label="إغلاق"
              className="absolute end-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
