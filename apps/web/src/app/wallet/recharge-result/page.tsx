"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useWallet, walletKeys } from "@/features/wallet/hooks";
import { walletService } from "@/features/wallet/services";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

const primary = "#D87B63";
const secondary = "#FFB50E";

type ResultStatus = "loading" | "success" | "failed" | "pending" | "error";

export default function WalletRechargeResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const reference = searchParams.get("reference") ?? "";
  const initialStatus = searchParams.get("status") ?? "";

  const [status, setStatus] = useState<ResultStatus>("loading");
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const polledRef = useRef(false);

  const { data: walletData } = useWallet(true);

  useEffect(() => {
    if (!reference) {
      // Defer so we don't call setState synchronously within the effect.
      const t = window.setTimeout(() => setStatus("error"), 0);
      return () => window.clearTimeout(t);
    }

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await walletService.getOnlinePaymentStatus(reference);
        if (cancelled) return;

        if (res.data.status === "paid") {
          setAmount(Number(res.data.amount));
          setBalance(Number(res.data.wallet_balance));
          setStatus("success");
          polledRef.current = true;
          qc.invalidateQueries({ queryKey: walletKeys.all });
        } else if (res.data.status === "failed") {
          setAmount(Number(res.data.amount));
          setFailureReason(res.data.failure_reason ?? "لم نتمكن من تأكيد العملية، يرجى المحاولة مرة أخرى.");
          setStatus("failed");
          polledRef.current = true;
        } else {
          // pending/expired: keep polling for a short window to catch the webhook.
          if (initialStatus === "success") {
            setStatus("pending");
            polledRef.current = false;
          } else {
            setStatus("failed");
            setFailureReason(res.data.failure_reason ?? "لم يتم إتمام الدفع. يرجى المحاولة مرة أخرى.");
            polledRef.current = true;
          }
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    };

    fetchStatus();

    // Poll up to ~15s so the webhook has time to mark the payment as paid.
    const interval = window.setInterval(async () => {
      if (polledRef.current) return;
      try {
        const res = await walletService.getOnlinePaymentStatus(reference);
        if (cancelled) return;
        if (res.data.status === "paid") {
          setAmount(Number(res.data.amount));
          setBalance(Number(res.data.wallet_balance));
          setStatus("success");
          polledRef.current = true;
          qc.invalidateQueries({ queryKey: walletKeys.all });
          window.clearInterval(interval);
        } else if (res.data.status === "failed") {
          setAmount(Number(res.data.amount));
          setFailureReason(res.data.failure_reason ?? "لم نتمكن من تأكيد العملية.");
          setStatus("failed");
          polledRef.current = true;
          window.clearInterval(interval);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 3000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!polledRef.current && status === "pending") {
        setStatus("pending");
      }
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, initialStatus]);

  const goBack = () => {
    router.back();
  };

  const goHome = () => {
    router.push("/");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-20 -start-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primary }}
        />
        <div
          className="absolute -bottom-24 -end-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: secondary }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-border/40 bg-card shadow-2xl shadow-black/10 p-6 sm:p-8 text-center"
            style={{ boxShadow: `0 25px 60px -12px ${primary}25` }}
          >
            {/* Loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-12 w-12 animate-spin" style={{ color: primary }} />
                <p className="mt-5 text-sm text-muted-foreground">جارٍ تأكيد حالة الدفع...</p>
              </div>
            )}

            {/* Pending */}
            {status === "pending" && (
              <div className="flex flex-col items-center py-6">
                <div
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: `linear-gradient(135deg, ${secondary}25, ${primary}18)` }}
                >
                  <AlertTriangle className="h-10 w-10" style={{ color: secondary }} />
                </div>
                <h1 className="text-lg font-bold text-foreground">ننتظر تأكيد الدفع</h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  إذا تم الدفع بنجاح، سيتم شحن محفظتك تلقائياً خلال لحظات.
                </p>
                <button
                  type="button"
                  onClick={goHome}
                  className="mt-6 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                    boxShadow: `0 4px 16px ${primary}40`,
                  }}
                >
                  العودة للصفحة الرئيسية
                </button>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: `linear-gradient(135deg, ${secondary}25, #22c55e18)` }}
                >
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </motion.div>
                <h1 className="text-lg font-bold text-foreground">تم شحن المحفظة بنجاح!</h1>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  أضيف المبلغ إلى رصيدك فوراً
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-5 w-full rounded-2xl border border-border/50 bg-background/60 px-6 py-4"
                >
                  <p className="text-xs text-muted-foreground/60">المبلغ المضاف</p>
                  <p className="mt-1 text-2xl font-extrabold text-green-600">
                    + {formatCurrency(amount)}
                  </p>
                  <div className="my-3 border-t border-dashed border-border/60" />
                  <p className="text-xs text-muted-foreground/60">رصيد المحفظة الحالي</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {balance !== null ? formatCurrency(balance) : formatCurrency(walletData?.balance)}
                  </p>
                </motion.div>

                <button
                  type="button"
                  onClick={goHome}
                  className="mt-6 flex h-11 items-center gap-2 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                    boxShadow: `0 4px 16px ${primary}40`,
                  }}
                >
                  <ArrowRight className="h-4 w-4" /> العودة
                </button>
              </div>
            )}

            {/* Failed */}
            {status === "failed" && (
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "rgba(239, 68, 68, 0.1)" }}
                >
                  <XCircle className="h-10 w-10 text-red-500" />
                </motion.div>
                <h1 className="text-lg font-bold text-foreground">لم يتم إتمام الشحن</h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {failureReason ?? "حدث خطأ أثناء إتمام عملية الدفع."}
                </p>
                {amount > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground/70">
                    المبلغ المطلوب: {formatCurrency(amount)}
                  </p>
                )}

                <div className="mt-6 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                      boxShadow: `0 4px 16px ${primary}40`,
                    }}
                  >
                    <Wallet className="h-4 w-4" /> إعادة المحاولة
                  </button>
                  <button
                    type="button"
                    onClick={goHome}
                    className="h-11 rounded-xl border border-border/50 bg-background/80 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    العودة للصفحة الرئيسية
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex flex-col items-center py-6">
                <div
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "rgba(239, 68, 68, 0.1)" }}
                >
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-lg font-bold text-foreground">تعذر التأكد من حالة الدفع</h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  يرجى التحقق من بريدك أو مراجعة رصيد محفظتك لاحقاً.
                </p>
                <button
                  type="button"
                  onClick={goHome}
                  className="mt-6 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                    boxShadow: `0 4px 16px ${primary}40`,
                  }}
                >
                  العودة للصفحة الرئيسية
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
