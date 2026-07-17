"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppButton } from "@/components/ui/AppButton";

interface LockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  onLogin: () => void;
}

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modal = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 24,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

export function LockedModal({
  isOpen,
  onClose,
  onEnroll,
  onLogin,
}: LockedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-md rounded-2xl border border-border/50 bg-background p-8",
              "shadow-2xl shadow-black/10",
            )}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "shadow-inner",
                )}
              >
                <Lock className="h-9 w-9 text-primary" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-foreground">
                محتوى مقفل
              </h3>
              <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
                يجب الاشتراك في الكورس للوصول إلى هذا المحتوى. اشترك الآن
                واستمتع بتجربة تعليمية متكاملة.
              </p>

              <div className="flex w-full flex-col gap-3">
                <AppButton
                  onClick={onEnroll}
                  className="w-full"
                  size="lg"
                >
                  اشترك الآن
                </AppButton>
                <AppButton
                  onClick={onLogin}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  تسجيل الدخول
                </AppButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
