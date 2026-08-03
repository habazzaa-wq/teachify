"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  Wallet,
  CreditCard,
  TicketCheck,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { usePurchaseCourse } from "../hooks";
import { formatCoursePrice } from "../utils";
import { useWallet } from "@/features/wallet/hooks";
import { useCurrentUser } from "@/hooks/useAuthStatus";
import { OnlineRechargeModal } from "@/features/wallet/components/OnlineRechargeModal";
import { RechargeWalletModal } from "@/features/wallet/components/RechargeWalletModal";
import { PRIMARY, ACCENT, CTA_GRADIENT } from "../brand";
import type { PublicCourse } from "../types";

const primary = PRIMARY;
const secondary = ACCENT;

interface PurchaseCourseModalProps {
  open: boolean;
  onClose: () => void;
  course: PublicCourse;
}

export function PurchaseCourseModal({ open, onClose, course }: PurchaseCourseModalProps) {
  const { isAuthenticated } = useCurrentUser();
  const { data: walletData } = useWallet(open && isAuthenticated);
  const purchase = usePurchaseCourse(course.slug);

  const [rechargeOnline, setRechargeOnline] = useState(false);
  const [rechargeCode, setRechargeCode] = useState(false);

  const balance = walletData?.balance ?? 0;
  const isFree = course.pricingType === "free";
  const price = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const walletLoading = !isFree && !walletData;
  const insufficient = !isFree && balance < price;

  const handleClose = useCallback(() => {
    if (purchase.isPending) return;
    setRechargeOnline(false);
    setRechargeCode(false);
    purchase.reset();
    onClose();
  }, [purchase, onClose]);

  const handleConfirm = useCallback(() => {
    if (purchase.isPending) return;
    purchase.mutate();
  }, [purchase]);

  const errorMessage = purchase.error
    ? (purchase.error as { message?: string }).message ?? "حدث خطأ غير متوقع. حاول مرة أخرى."
    : null;

  return (
    <>
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
              aria-label="تأكيد الاشتراك في الدورة"
            >
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
                style={{ background: `linear-gradient(90deg, ${primary}, ${secondary}, ${primary})` }}
              />

              <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
                {/* Success */}
                {purchase.data ? (
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
                    <h3 className="text-lg font-bold text-foreground">
                      {isFree ? "تم الاشتراك في الدورة بنجاح!" : "تم شراء الدورة بنجاح!"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground/70 text-center max-w-xs">
                      أصبح لديك الآن وصول كامل لجميع دروس ومحتوى الدورة.
                    </p>
                    {purchase.data.amount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-4 rounded-2xl border border-border/50 bg-background/60 px-6 py-4 text-center w-full max-w-xs"
                      >
                        <p className="text-xs text-muted-foreground/60">رصيد المحفظة المتبقي</p>
                        <p className="mt-1 text-2xl font-extrabold" style={{ color: primary }}>
                          {formatCoursePrice(purchase.data.balance)}
                        </p>
                      </motion.div>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-6 h-10 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                        boxShadow: `0 4px 16px ${primary}40`,
                      }}
                    >
                      ابدأ التعلم
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
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-base font-bold text-foreground">
                        {isFree ? "الاشتراك في الدورة" : "تأكيد شراء الدورة"}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground/60 line-clamp-1">
                        {course.title}
                      </p>
                    </div>

                    {/* Loading wallet */}
                    {walletLoading ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
                        <p className="mt-3 text-sm text-muted-foreground/60">
                          جارٍ التحقق من رصيد محفظتك...
                        </p>
                      </div>
                    ) : insufficient ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-4 w-full rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-4 dark:bg-amber-950/20">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                            <div>
                              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                رصيد المحفظة غير كافٍ
                              </p>
                              <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/70">
                                سعر الدورة {formatCoursePrice(price)} ورصيدك الحالي{" "}
                                {formatCoursePrice(balance)}. اشحن محفظتك أولاً لتتمكن من الاشتراك.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid w-full gap-3">
                          <button
                            type="button"
                            onClick={() => setRechargeOnline(true)}
                            className="relative flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white transition-all duration-300 group overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                              boxShadow: `0 4px 16px ${primary}40`,
                            }}
                          >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                            <CreditCard className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">شحن المحفظة أونلاين</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRechargeCode(true)}
                            className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold border border-border/50 bg-background/80 text-foreground hover:bg-accent/50 transition-all duration-200"
                          >
                            <TicketCheck className="h-4 w-4" style={{ color: primary }} />
                            شحن المحفظة بكود شحن
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Price summary */}
                        <div className="mb-4 rounded-2xl border border-border/50 bg-background/60 px-5 py-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground/70">سعر الدورة</span>
                            <span className="font-extrabold text-foreground">
                              {formatCoursePrice(price)}
                            </span>
                          </div>
                          <div className="my-2.5 border-t border-dashed border-border/60" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                              <Wallet className="h-4 w-4" style={{ color: primary }} />
                              رصيد محفظتك
                            </span>
                            <span className="font-bold text-foreground">{formatCoursePrice(balance)}</span>
                          </div>
                          <div className="my-2.5 border-t border-dashed border-border/60" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground/70">الرصيد المتبقي بعد الشراء</span>
                            <span className="font-extrabold" style={{ color: primary }}>
                              {formatCoursePrice(Math.max(0, balance - price))}
                            </span>
                          </div>
                        </div>

                        {errorMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"
                          >
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">
                              {errorMessage}
                            </p>
                          </motion.div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={purchase.isPending}
                            className="relative flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60 group overflow-hidden"
                            style={{
                              background: CTA_GRADIENT,
                              boxShadow: `0 4px 16px ${primary}40`,
                            }}
                          >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                            {purchase.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                            ) : (
                              <Sparkles className="h-4 w-4 relative z-10" />
                            )}
                            <span className="relative z-10">
                              {purchase.isPending
                                ? isFree
                                  ? "جارٍ الاشتراك..."
                                  : "جارٍ الشراء..."
                                : isFree
                                  ? "تأكيد الاشتراك"
                                  : "تأكيد الشراء"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleClose}
                            disabled={purchase.isPending}
                            className="h-11 px-5 rounded-xl text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                          >
                            إلغاء
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50">
                          <ShieldCheck className="h-3.5 w-3.5" style={{ color: secondary }} />
                          سيتم خصم المبلغ من محفظتك فوراً وفتح كامل محتوى الدورة
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OnlineRechargeModal open={rechargeOnline} onClose={() => setRechargeOnline(false)} />
      <RechargeWalletModal open={rechargeCode} onClose={() => setRechargeCode(false)} />
    </>
  );
}
