"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Crown,
  ShieldCheck,
  Smartphone,
  Download,
  ClipboardCheck,
  Award,
  RefreshCw,
  Users,
  BookOpen,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { SubscribeButton } from "./primitives";
import { ACCENT, CTA_GRADIENT, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "../brand";
import type { PublicCourse } from "../types";

interface PurchaseSidebarProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
}

const includes = [
  { icon: Crown, text: "وصول دائم للدورة" },
  { icon: Smartphone, text: "الوصول عبر الهاتف" },
  { icon: Download, text: "ملفات قابلة للتحميل" },
  { icon: ClipboardCheck, text: "اختبارات وتمارين" },
  { icon: Award, text: "شهادة إتمام" },
  { icon: RefreshCw, text: "تحديثات مستقبلية" },
] as const;

function PurchaseSidebarInner({ course, isEnrolled, onEnroll }: PurchaseSidebarProps) {
  const prefersReduced = useReducedMotion();
  const coverSrc = course.coverImage || course.thumbnail;

  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const currency = course.currency;

  const discountPercent = useMemo(() => {
    if (!hasDiscount || !originalPrice || !course.discountPrice) return 0;
    return Math.round(((originalPrice - course.discountPrice) / originalPrice) * 100);
  }, [hasDiscount, originalPrice, course.discountPrice]);

  const diffColor = DIFFICULTY_COLORS[course.difficulty] ?? DIFFICULTY_COLORS.beginner!;

  return (
    <motion.aside
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
      aria-label="تفاصيل الاشتراك"
    >
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-black/5">
        <div className="h-1.5 w-full" style={{ background: CTA_GRADIENT }} />

        {/* Cover image */}
        <div className="relative aspect-video w-full overflow-hidden">
          {coverSrc && coverSrc.startsWith("https") ? (
            <Image
              src={coverSrc}
              alt={course.title}
              fill
              sizes="(max-width: 1024px) 100vw, 380px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: CTA_GRADIENT }}
            >
              <BookOpen className="h-12 w-12 text-white/70" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.4))" }}
          />
          <span
            className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md"
            style={{ background: diffColor }}
          >
            {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
          </span>
        </div>

        <div className="p-5">
          {/* Price */}
          <div className="mb-4">
            {isFree ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  مجاني
                </span>
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-2.5">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  {formatNumber(displayPrice)}
                </span>
                {currency && (
                  <span className="mb-1 text-sm font-semibold text-muted-foreground">
                    {currency}
                  </span>
                )}
                {hasDiscount && (
                  <>
                    <span className="mb-1 text-base text-muted-foreground line-through">
                      {formatNumber(originalPrice)} {currency ?? ""}
                    </span>
                    <span
                      className="mb-1 rounded-lg px-2 py-0.5 text-[11px] font-extrabold"
                      style={{ background: `${ACCENT}22`, color: "#b45309" }}
                    >
                      خصم {discountPercent}%
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          {isEnrolled ? (
            <button
              type="button"
              onClick={onEnroll}
              className={cn(
                "group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-4",
                "text-base font-extrabold text-white shadow-lg shadow-emerald-600/25",
                "bg-emerald-600 transition-colors duration-200 hover:bg-emerald-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <Play className="h-5 w-5 fill-current" />
              ابدأ التعلم الآن
            </button>
          ) : (
            <SubscribeButton onClick={onEnroll} label="اشترك الآن وابدأ التعلم" />
          )}

          {/* Guarantee */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ضمان استرداد الأموال خلال 30 يوماً
          </div>

          {/* Divider */}
          <div className="my-5 h-px w-full bg-border/50" />

          {/* Course includes */}
          <h4 className="mb-3 text-sm font-extrabold text-foreground">يتضمن الدورة</h4>
          <ul className="grid grid-cols-1 gap-2.5">
            {includes.map((item) => (
              <li key={item.text} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#BF6D58]/10">
                  <Check className="h-3 w-3 text-[#BF6D58]" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-5 h-px w-full bg-border/50" />

          {/* Stats */}
          <div className="flex items-center justify-center gap-1 rounded-xl bg-muted/50 px-4 py-2.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-[#BF6D58]" />
              {formatNumber(course.studentsCount)} طالب
            </span>
            <span className="mx-1.5 text-xs text-muted-foreground/40">•</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-[#BF6D58]" />
              {formatNumber(course.lessonsCount)} درس
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

const PurchaseSidebar = memo(PurchaseSidebarInner);

export { PurchaseSidebar };
export default PurchaseSidebar;
