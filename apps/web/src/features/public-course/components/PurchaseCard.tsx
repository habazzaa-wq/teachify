"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Crown,
  Shield,
  Smartphone,
  Download,
  ClipboardCheck,
  Award,
  RefreshCw,
  Play,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useUiStore } from "@/stores/ui.store";
import type { PublicCourse } from "../types";

interface PurchaseCardProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
  onLogin: () => void;
}

const features = [
  { icon: Shield, text: "صول دائم" },
  { icon: Smartphone, text: "صول عبر الهاتف" },
  { icon: Download, text: "ملفات قابلة للتحميل" },
  { icon: ClipboardCheck, text: "اختبارات وتمارين" },
  { icon: Award, text: "شهادة إتمام" },
  { icon: RefreshCw, text: "تحديثات مستقبلية" },
] as const;

export default function PurchaseCard({
  course,
  isEnrolled,
  onEnroll,
  onLogin,
}: PurchaseCardProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;

  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;

  const discountPercent = useMemo(() => {
    if (!hasDiscount || !originalPrice || !course.discountPrice) return 0;
    return Math.round(((originalPrice - course.discountPrice) / originalPrice) * 100);
  }, [hasDiscount, originalPrice, course.discountPrice]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-24 w-full"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border",
          isDark
            ? "border-white/10 bg-background/80 shadow-xl shadow-black/30"
            : "border-neutral-200/80 bg-white/80 shadow-xl shadow-neutral-900/10",
          "backdrop-blur-xl"
        )}
      >
        {/* Decorative gradient accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-l from-[#BF6D58] via-[#d4856f] to-[#FFB50E]" />

        {/* Subtle glow orb */}
        <div
          className={cn(
            "pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl",
            "bg-[#BF6D58]"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full opacity-15 blur-3xl",
            "bg-[#FFB50E]"
          )}
        />

        <div className="relative p-6">
          {/* Price Section */}
          <div className="mb-5">
            {isFree ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-500">
                  مجاني
                </span>
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <span
                  className={cn(
                    "text-3xl font-extrabold tracking-tight",
                    isDark ? "text-white" : "text-neutral-900"
                  )}
                >
                  {formatNumber(displayPrice)}
                </span>

                {course.currency && (
                  <span
                    className={cn(
                      "mb-1 text-sm font-medium",
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    )}
                  >
                    {course.currency}
                  </span>
                )}

                {hasDiscount && (
                  <>
                    <span
                      className={cn(
                        "mb-1 text-base line-through",
                        isDark ? "text-neutral-500" : "text-neutral-400"
                      )}
                    >
                      {formatNumber(originalPrice)}
                    </span>
                    <span
                      className={cn(
                        "mb-1 rounded-lg px-2.5 py-0.5 text-xs font-bold",
                        "bg-[#FFB50E]/15 text-[#FFB50E]"
                      )}
                    >
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Main CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isEnrolled ? onEnroll : onLogin}
            className={cn(
              "group relative mb-6 flex w-full items-center justify-center gap-2.5",
              "rounded-xl px-6 py-3.5 text-base font-bold transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isEnrolled
                ? cn(
                    "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500",
                    isDark && "focus-visible:ring-offset-neutral-900"
                  )
                : cn(
                    "bg-gradient-to-l from-[#BF6D58] to-[#a85a47] text-white",
                    "hover:from-[#a85a47] hover:to-[#BF6D58] shadow-lg shadow-[#BF6D58]/25",
                    "hover:shadow-xl hover:shadow-[#BF6D58]/30",
                    "focus-visible:ring-[#BF6D58]",
                    isDark && "focus-visible:ring-offset-neutral-900"
                  )
            )}
          >
            {isEnrolled ? (
              <>
                <Play className="h-5 w-5 fill-current" />
                <span>ابدأ التعلم</span>
              </>
            ) : (
              <>
                <Crown className="h-5 w-5" />
                <span>اشترك الآن</span>
              </>
            )}

            {/* Shimmer effect on hover */}
            {!isEnrolled && (
              <span
                className={cn(
                  "absolute inset-0 overflow-hidden rounded-xl",
                  "opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]",
                    "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  )}
                />
              </span>
            )}
          </motion.button>

          {/* Divider */}
          <div
            className={cn(
              "mb-5 h-px w-full",
              isDark ? "bg-white/10" : "bg-neutral-200"
            )}
          />

          {/* Course Includes Section */}
          <div>
            <h4
              className={cn(
                "mb-3 text-sm font-semibold",
                isDark ? "text-neutral-300" : "text-neutral-600"
              )}
            >
              يتضمن الدورة
            </h4>

            <ul className="space-y-2.5">
              {features.map(({ text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      "bg-[#BF6D58]/10"
                    )}
                  >
                    <Check className="h-3 w-3 text-[#BF6D58]" strokeWidth={3} />
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      isDark ? "text-neutral-300" : "text-neutral-600"
                    )}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats Footer */}
          <div
            className={cn(
              "mt-5 flex items-center justify-center gap-1 rounded-xl px-4 py-2.5",
              isDark ? "bg-white/5" : "bg-neutral-50"
            )}
          >
            <span
              className={cn(
                "text-xs",
                isDark ? "text-neutral-400" : "text-neutral-500"
              )}
            >
              {formatNumber(course.studentsCount)} طالب مسجّل
            </span>
            <span className={cn("mx-1.5 text-xs", isDark ? "text-neutral-600" : "text-neutral-300")}>
              •
            </span>
            <span
              className={cn(
                "text-xs",
                isDark ? "text-neutral-400" : "text-neutral-500"
              )}
            >
              {formatNumber(course.lessonsCount)} درس
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
