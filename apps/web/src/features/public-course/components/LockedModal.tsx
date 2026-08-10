"use client";

import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, LogIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { SubscribeButton } from "./primitives";
import { LOCKED_GRADIENT } from "../brand";

interface LockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  onLogin: () => void;
}

function LockedModalInner({ isOpen, onClose, onEnroll, onLogin }: LockedModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="locked-modal-title"
        >
          {/* Backdrop (opacity only, no blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-3xl border border-[rgb(var(--brand-primary-rgb)/0.2)] bg-card shadow-2xl shadow-black/20",
            )}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className="p-8 text-center"
              style={{ background: LOCKED_GRADIENT }}
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/25 bg-gradient-to-br from-[rgb(var(--brand-primary-rgb)/0.2)] to-[rgb(var(--brand-secondary-rgb)/0.1)] shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.1)]">
                <Lock className="h-9 w-9 text-[var(--brand-primary)]" strokeWidth={2} />
              </div>

              <h3
                id="locked-modal-title"
                className="mb-2 text-xl font-extrabold text-foreground"
              >
                هذا المحتوى متاح للمشتركين فقط
              </h3>
              <p className="mx-auto mb-7 max-w-xs text-sm leading-relaxed text-muted-foreground">
                اشترك الآن للوصول إلى جميع المحاضرات والملفات والاختبارات،
                مع شهادة إتمام عند الانتهاء من الدورة.
              </p>

              <div className="flex flex-col gap-3">
                <SubscribeButton onClick={onEnroll} label="اشترك الآن وابدأ التعلم" />
                <button
                  type="button"
                  onClick={onLogin}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)]"
                >
                  <LogIn className="h-4 w-4" />
                  لديك حساب بالفعل؟ سجّل الدخول
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const LockedModal = memo(LockedModalInner);

export { LockedModal };
export type { LockedModalProps };
