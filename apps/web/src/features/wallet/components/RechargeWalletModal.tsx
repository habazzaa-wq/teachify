"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Loader2,
  CheckCircle,
  TicketCheck,
  Banknote,
  Sparkles,
  X,
} from "lucide-react";
import { useRechargeWallet, useWallet } from "../hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

const primary = "#D87B63";
const secondary = "#FFB50E";

interface RechargeWalletModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const ERROR_MESSAGES: Record<number, string> = {
  0: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت",
  401: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى",
  422: "يرجى مراجعة البيانات المدخلة",
  429: "محاولات كثيرة جداً. حاول مرة أخرى لاحقاً",
};

export function RechargeWalletModal({ open, onClose }: RechargeWalletModalProps) {
  const recharge = useRechargeWallet();
  const { data: walletData } = useWallet(true);

  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    amount: number;
    balance: number;
    message: string;
  } | null>(null);

  const balance = walletData?.balance ?? 0;

  const resetForm = useCallback(() => {
    setCode("");
    setErrors({});
    setApiError(null);
    setDone(null);
  }, []);

  const validateForm = useCallback((): FormErrors => {
    const next: FormErrors = {};
    if (!code.trim()) {
      next.code = "كود الشحن مطلوب";
    } else if (code.replace(/[^A-Za-z0-9]/g, "").length < 6) {
      next.code = "كود الشحن غير صالح";
    }
    return next;
  }, [code]);

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setErrors((prev) => ({ ...prev, code: "" }));
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError(null);
    try {
      const result = await recharge.mutateAsync(code);
      setDone({
        amount: Number(result.data.amount),
        balance: Number(result.data.balance),
        message: result.message,
      });
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string; fieldErrors?: Record<string, string[]> };
      const status = apiErr?.status ?? 0;

      if (apiErr?.fieldErrors) {
        const flat: FormErrors = {};
        for (const [key, msgs] of Object.entries(apiErr.fieldErrors)) {
          flat[key] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
        }
        setErrors(flat);
      }

      setApiError(apiErr?.message || ERROR_MESSAGES[status] || "حدث خطأ غير متوقع. حاول مرة أخرى.");
    }
  };

  const handleClose = useCallback(() => {
    if (recharge.isPending) return;
    resetForm();
    onClose();
  }, [recharge.isPending, onClose, resetForm]);

  const inputClasses = cn(
    "h-11 w-full rounded-xl border bg-background/80 px-3 text-sm transition-all duration-200",
    "placeholder:text-muted-foreground/35",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    errors.code
      ? "border-red-400 focus:ring-red-400/30"
      : "border-border/50 focus:ring-primary/20 focus:border-primary/50",
  );

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
            style={{ boxShadow: `0 25px 60px -12px ${primary}25, 0 0 0 1px ${primary}10` }}
            role="dialog"
            aria-modal="true"
            aria-label="شحن المحفظة بالكود"
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, ${primary}, ${secondary}, ${primary})` }}
            />

            <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: `linear-gradient(135deg, ${secondary}25, ${primary}18)` }}
                  >
                    <CheckCircle className="h-10 w-10" style={{ color: secondary }} />
                  </motion.div>
                  <h3 className="text-lg font-bold text-foreground">تم شحن محفظتك بنجاح!</h3>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-4 rounded-2xl border border-border/50 bg-background/60 px-6 py-4 text-center w-full max-w-xs"
                  >
                    <p className="text-xs text-muted-foreground/60">المبلغ المضاف</p>
                    <p
                      className="mt-1 text-2xl font-extrabold"
                      style={{ color: primary }}
                    >
                      + {formatCurrency(done.amount)}
                    </p>
                    <div
                      className="my-3 border-t border-dashed border-border/60"
                    />
                    <p className="text-xs text-muted-foreground/60">رصيد المحفظة الحالي</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatCurrency(done.balance)}
                    </p>
                  </motion.div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 h-10 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                      boxShadow: `0 4px 16px ${primary}40`,
                    }}
                  >
                    تم
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 text-center">
                    <div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                        boxShadow: `0 4px 16px ${primary}40`,
                      }}
                    >
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">شحن المحفظة بالكود</h2>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      أدخل كود الشحن لتفعيل رصيدك فوراً
                    </p>
                  </div>

                  {/* Current balance */}
                  <div
                    className="mb-5 flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{
                      background: `linear-gradient(135deg, ${secondary}18, ${primary}12)`,
                      border: `1px solid ${secondary}40`,
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
                    {/* Code */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <TicketCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
                        كود الشحن
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          dir="ltr"
                          value={code}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          placeholder="XXXXX-XXXXX"
                          disabled={recharge.isPending}
                          autoComplete="off"
                          spellCheck={false}
                          className={cn(inputClasses, "text-left pe-10 tracking-[0.2em] font-mono font-semibold")}
                        />
                        <button
                          type="button"
                          onClick={() => setCode("")}
                          className={cn(
                            "absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-opacity",
                            code ? "opacity-100" : "opacity-0 pointer-events-none",
                          )}
                          tabIndex={-1}
                          aria-label="مسح الكود"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {errors.code ? (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {errors.code}
                        </motion.p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" style={{ color: secondary }} />
                          الكود يظهر في كارت الشحن الخاص بك
                        </p>
                      )}
                    </div>

                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"
                      >
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                          {apiError}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={recharge.isPending}
                        className="relative flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60 group overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                          boxShadow: `0 4px 16px ${primary}40`,
                        }}
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {recharge.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                        ) : (
                          <Wallet className="h-4 w-4 relative z-10" />
                        )}
                        <span className="relative z-10">
                          {recharge.isPending ? "جارٍ شحن المحفظة..." : "شحن المحفظة"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={recharge.isPending}
                        className="h-11 px-5 rounded-xl text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
