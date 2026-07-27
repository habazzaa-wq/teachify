"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Crown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

interface LockedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  onLogin: () => void;
}

export function LockedContentModal({
  isOpen,
  onClose,
  onEnroll,
  onLogin,
}: LockedContentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-background p-8",
              "shadow-2xl shadow-black/10",
            )}
          >
            <div className="h-1 w-full bg-gradient-to-l from-[#BF6D58] via-[#d4856f] to-[#FFB50E]" />

            <div className="pointer-events-none absolute -left-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-3xl bg-[#BF6D58]" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-28 w-28 rounded-full opacity-10 blur-3xl bg-[#FFB50E]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute end-4 top-5 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className={cn(
                  "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-[#BF6D58]/20 to-[#BF6D58]/5",
                  "shadow-inner",
                )}
              >
                <Lock className="h-9 w-9 text-[#BF6D58]" />
              </motion.div>

              <h3 className="mb-2 text-lg font-bold text-foreground">
                محتوى مقفل
              </h3>
              <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
                يجب الاشتراك في الكورس للوصول إلى هذا المحتوى. اشترك الآن
                واستمتع بتجربة تعليمية متكاملة.
              </p>

              <div className="flex w-full flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onEnroll}
                  className={cn(
                    "group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5",
                    "text-base font-bold text-white transition-all duration-300",
                    "bg-gradient-to-l from-[#BF6D58] to-[#a85a47]",
                    "hover:from-[#a85a47] hover:to-[#BF6D58] shadow-lg shadow-[#BF6D58]/25",
                    "hover:shadow-xl hover:shadow-[#BF6D58]/30",
                  )}
                >
                  <Crown className="h-5 w-5" />
                  <span>اشترك الآن</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </motion.button>

                <button
                  type="button"
                  onClick={onLogin}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3.5",
                    "text-sm font-semibold transition-all duration-200",
                    "border-border/60 text-muted-foreground",
                    "hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
