"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { SubscribeButton } from "./primitives";
import type { PublicCourse } from "../types";

interface MobilePurchaseBarProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
}

function MobilePurchaseBarInner({ course, isEnrolled, onEnroll }: MobilePurchaseBarProps) {
  const isFree = course.pricingType === "free";
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const hasDiscount = !isFree && originalPrice > displayPrice && displayPrice > 0;
  const currency = course.currency;

  const discountPercent = useMemo(
    () =>
      hasDiscount
        ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
        : 0,
    [hasDiscount, originalPrice, displayPrice],
  );

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card shadow-[0_-6px_24px_rgba(0,0,0,0.08)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {isFree ? (
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              مجاني
            </span>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-extrabold text-[var(--brand-primary)]">
                {formatNumber(displayPrice)} {currency ?? ""}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatNumber(originalPrice)}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
                    style={{ background: `rgb(var(--brand-secondary-rgb) / 0.133)`, color: "var(--brand-secondary-contrast)" }}
                  >
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground/70">
            {formatNumber(course.studentsCount)} طالب مسجّل
          </span>
        </div>

        {isEnrolled ? (
          <button
            type="button"
            onClick={onEnroll}
            className={cn(
              "inline-flex min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white",
              "transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
            )}
          >
            <Play className="h-4 w-4 fill-current" />
            ابدأ التعلم
          </button>
        ) : (
          <div className="min-w-[140px] shrink-0">
            <SubscribeButton onClick={onEnroll} label="اشترك الآن" size="md" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

const MobilePurchaseBar = memo(MobilePurchaseBarInner);

export { MobilePurchaseBar };
export type { MobilePurchaseBarProps };
