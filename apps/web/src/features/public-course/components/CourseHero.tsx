"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  Heart,
  Share2,
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useUiStore } from "@/stores/ui.store";
import { formatDurationLong } from "../utils";
import type { PublicCourse } from "../types";

const PRIMARY = "#BF6D58";
const ACCENT = "#FFB50E";
const CTA_GRADIENT = "linear-gradient(135deg, #BF6D58, #a85a47)";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

const LANGUAGE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
};

interface CourseHeroProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
  onLogin: () => void;
}

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-amber-500/25"
              style={{ width: size, height: size }}
            />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className="fill-amber-400 text-amber-400"
                style={{ width: size, height: size }}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function MetaSep({ color }: { color: string }) {
  return <span aria-hidden className="hidden h-4 w-px sm:block" style={{ background: color }} />;
}

function CornerMark({ className, color }: { className?: string; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none absolute z-10", className)}
    >
      <path d="M2 18V6a4 4 0 0 1 4-4h12" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function Stamp({
  label,
  tone,
  icon,
  rotate,
  mat,
}: {
  label: string;
  tone: string;
  icon: React.ReactNode;
  rotate: string;
  mat: string;
}) {
  return (
    <div
      className="flex h-[70px] w-[70px] flex-col items-center justify-center gap-0.5 rounded-full text-center"
      style={{
        background: mat,
        border: `2px dashed ${tone}77`,
        color: tone,
        transform: `rotate(${rotate})`,
        boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
      }}
    >
      <span className="px-1 text-[9px] font-black leading-tight">{label}</span>
      {icon}
    </div>
  );
}

function CourseHeroInner({ course, isEnrolled, onEnroll, onLogin }: CourseHeroProps) {
  const theme = useUiStore((s) => s.theme);
  const prefersReduced = useReducedMotion();
  const isDark = theme === "dark";
  const [wishlisted, setWishlisted] = useState(false);

  const rating = 4.8;
  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isEnrolled &&
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - course.discountPrice!) / originalPrice) * 100)
    : 0;
  const currency = "ج.م";

  const coverSrc = course.coverImage || course.thumbnail;
  const ghostLetter = course.title.trim().charAt(0) || "د";

  const ink = isDark ? "#f5efe4" : "#221a11";
  const soft = isDark ? "rgba(245,239,228,0.66)" : "#6f6352";
  const faint = isDark ? "rgba(245,239,228,0.42)" : "#9a8d7b";
  const line = isDark ? "rgba(245,239,228,0.16)" : "rgba(34,26,17,0.14)";
  const mat = isDark ? "#1e1915" : "#fffdf8";
  const walnut = "linear-gradient(135deg, #2c1e12 0%, #412c1a 55%, #2c1e12 100%)";
  const lip = isDark ? "#5c4932" : "#d8c4a2";
  const mark = isDark ? "#d99a7f" : PRIMARY;

  const handleWishlist = useCallback(() => {
    setWishlisted((prev) => {
      const next = !prev;
      toast.success(next ? "تمت الإضافة إلى المفضلة" : "تمت الإزالة من المفضلة");
      return next;
    });
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط الدورة");
      }
    } catch {
      toast.error("تعذر مشاركة الدورة");
    }
  }, [course.title]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(180deg, #15110e 0%, #14100d 55%, #110d0b 100%)"
          : "linear-gradient(180deg, #f9f4ec 0%, #f6efe4 60%, #f2e9db 100%)",
      }}
    >
      {/* editorial ruled grid — faint vertical hairlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent 79px, ${line} 79px, ${line} 80px)`,
          opacity: isDark ? 0.5 : 0.6,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pb-24">
        {/* top editorial rule */}
        <div
          className="mb-10 flex items-center justify-between border-b pb-3 text-[10px] font-black uppercase tracking-[0.24em] sm:mb-14"
          style={{ borderColor: line, color: faint }}
        >
          <span>الأكاديمية الرقمية</span>
          <span className="hidden sm:inline">دليل الدورات المعتمدة</span>
          <span className="tabular-nums" dir="ltr">
            {String(course.lessonsCount).padStart(2, "0")} دروس
          </span>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
          {/* ── Editorial text column ── */}
          <div className="relative flex flex-col gap-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-12 -start-2 hidden select-none text-[13rem] font-black leading-none md:block"
              style={{ color: isDark ? "#fff" : "#000", opacity: 0.04 }}
            >
              {ghostLetter}
            </span>

            {/* eyebrow index */}
            <motion.div {...fade(0.05)} className="relative flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="tabular-nums" style={{ color: PRIMARY }} dir="ltr">
                01
              </span>
              <span className="h-px w-10" style={{ background: PRIMARY }} />
              <span style={{ color: soft }}>{course.category?.name ?? "دورة احترافية"}</span>
              {course.difficulty && (
                <>
                  <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: faint }} />
                  <span style={{ color: soft }}>
                    {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
                  </span>
                </>
              )}
              {course.educationalStage && (
                <>
                  <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: faint }} />
                  <span style={{ color: soft }}>{course.educationalStage.name}</span>
                </>
              )}
            </motion.div>

            <motion.h1
              {...fade(0.12)}
              className="relative max-w-2xl text-balance text-[2.1rem] font-black leading-[1.14] tracking-tight sm:text-5xl"
              style={{ color: ink }}
            >
              {course.title}
              <span aria-hidden className="mt-3 block h-[10px] w-48 max-w-full sm:w-64">
                <svg viewBox="0 0 260 10" preserveAspectRatio="none" className="h-full w-full">
                  <path
                    d="M3 8C48 3 96 9 150 6c34-2 70 0 107-2"
                    stroke={PRIMARY}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            {course.subtitle && (
              <motion.p
                {...fade(0.18)}
                className="relative max-w-2xl text-lg font-bold leading-relaxed sm:text-xl"
                style={{ color: soft }}
              >
                {course.subtitle}
              </motion.p>
            )}

            {course.shortDescription && (
              <motion.p
                {...fade(0.24)}
                className="relative max-w-2xl text-sm leading-relaxed sm:text-[15px]"
                style={{ color: faint }}
              >
                {course.shortDescription}
              </motion.p>
            )}

            <motion.div {...fade(0.3)} className="relative h-px w-full" style={{ background: line }} />

            {/* meta row */}
            <motion.div
              {...fade(0.34)}
              className="relative flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
              style={{ color: soft }}
            >
              <span className="inline-flex items-center gap-1.5 font-bold">
                <RatingStars rating={rating} size={13} />
                <span className="tabular-nums" style={{ color: ink }}>
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs font-medium">({formatNumber(course.studentsCount)} تقييم)</span>
              </span>

              <MetaSep color={line} />

              <span className="inline-flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4" style={{ color: PRIMARY }} />
                {formatNumber(course.studentsCount)} طالب
              </span>

              {course.duration != null && course.duration > 0 && (
                <>
                  <MetaSep color={line} />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4" style={{ color: ACCENT }} />
                    {formatDurationLong(course.duration)}
                  </span>
                </>
              )}

              <MetaSep color={line} />

              <span className="inline-flex items-center gap-1.5 font-medium">
                <BookOpen className="h-4 w-4" style={{ color: PRIMARY }} />
                {formatNumber(course.lessonsCount)} درس
              </span>

              <MetaSep color={line} />

              <span className="inline-flex items-center gap-1.5 font-medium">
                {LANGUAGE_LABELS[course.language] ?? course.language}
              </span>
            </motion.div>

            {/* tags */}
            {course.tags.length > 0 && (
              <motion.div {...fade(0.38)} className="relative flex flex-wrap gap-2">
                {course.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-[4px] border px-2.5 py-1 text-[11px] font-bold"
                    style={{ borderColor: line, color: faint }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </motion.div>
            )}

            {course.certificateEnabled && (
              <motion.div {...fade(0.42)} className="relative inline-flex w-fit items-center gap-2">
                <Award className="h-4 w-4" style={{ color: PRIMARY }} />
                <span className="text-xs font-bold" style={{ color: soft }}>
                  شهادة إتمام معتمدة بعد إكمال الدورة
                </span>
              </motion.div>
            )}

            {/* desktop actions */}
            <motion.div
              {...fade(0.46)}
              className="relative hidden items-center gap-6 lg:flex"
            >
              <button
                type="button"
                onClick={handleWishlist}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:opacity-70"
                style={{ color: soft }}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    wishlisted && "fill-[#BF6D58] text-[#BF6D58]",
                  )}
                  style={!wishlisted ? { color: PRIMARY } : undefined}
                />
                {wishlisted ? "في المفضلة" : "أضف إلى المفضلة"}
              </button>

              <MetaSep color={line} />

              <button
                type="button"
                onClick={handleShare}
                aria-label="مشاركة الدورة"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:opacity-70"
                style={{ color: soft }}
              >
                <Share2 className="h-4 w-4" style={{ color: PRIMARY }} />
                مشاركة الدورة
              </button>
            </motion.div>
          </div>

          {/* ── Framed artwork column ── */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[500px]"
          >
            {/* frame */}
            <div className="relative" style={{ boxShadow: "0 30px 60px -22px rgba(40,22,8,0.35)" }}>
              <div className="relative border" style={{ borderColor: line }}>
                {/* paper mat */}
                <div className="p-2.5 sm:p-3" style={{ background: mat }}>
                  {/* corner registration marks */}
                  <CornerMark className="top-2.5 start-2.5 rotate-180 sm:top-3 sm:start-3" color={mark} />
                  <CornerMark className="top-2.5 end-2.5 -rotate-90 sm:top-3 sm:end-3" color={mark} />
                  <CornerMark className="bottom-2.5 start-2.5 sm:bottom-3 sm:start-3" color={mark} />
                  <CornerMark className="bottom-2.5 end-2.5 rotate-90 sm:bottom-3 sm:end-3" color={mark} />

                  {/* walnut band */}
                  <div
                    className="relative p-[9px] sm:p-3"
                    style={{ background: walnut, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="relative aspect-[4/3] overflow-hidden"
                      style={{ boxShadow: `inset 0 0 0 2px ${lip}` }}
                    >
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={course.title}
                          fill
                          sizes="(max-width: 1024px) 90vw, 480px"
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${PRIMARY}2a, ${ACCENT}18)` }}
                        >
                          <BookOpen className="h-16 w-16" style={{ color: `${PRIMARY}66` }} />
                        </div>
                      )}
                      {/* legibility shade for the label */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ background: "linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.3) 100%)" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* paper rating label */}
            <div
              className="absolute bottom-7 start-4 z-10 flex items-center gap-2 border px-3 py-2 sm:bottom-8"
              style={{ background: mat, borderColor: line, boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}
            >
              <RatingStars rating={rating} size={13} />
              <span className="text-sm font-black tabular-nums" style={{ color: ink }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: soft }}>
                {formatNumber(course.studentsCount)} تقييم
              </span>
            </div>

            {/* notary stamps */}
            {course.certificateEnabled && (
              <div className="absolute -top-3 -start-3 z-20 sm:-top-4 sm:-start-4">
                <Stamp
                  label="شهادة معتمدة"
                  tone={mark}
                  rotate="-10deg"
                  mat={mat}
                  icon={<Award className="h-3.5 w-3.5" />}
                />
              </div>
            )}
            {isFree && (
              <div className="absolute -top-3 -end-3 z-20 sm:-top-4 sm:-end-4">
                <Stamp
                  label="مجانية"
                  tone="#059669"
                  rotate="9deg"
                  mat={mat}
                  icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
                />
              </div>
            )}

            {/* brass plaque */}
            <div className="relative z-20 mx-auto -mt-1.5 w-fit">
              <div
                className="flex items-center justify-center px-5 py-1.5"
                style={{
                  background: "linear-gradient(180deg, #211811, #2b2014)",
                  border: "1px solid rgba(201,164,92,0.35)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
                }}
              >
                <span
                  className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.24em]"
                  style={{ color: "#d9b878" }}
                >
                  {[course.category?.name, isFree ? "مجانية" : "دورة معتمدة"].filter(Boolean).join(" · ")}
                </span>
              </div>
            </div>

            {/* ── Mobile price + subscribe card ── */}
            <div
              className="mt-9 border lg:hidden"
              style={{ borderColor: line, background: mat, boxShadow: "0 18px 40px -26px rgba(30,20,10,0.4)" }}
            >
              <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: faint }}>
                    سعر الالتحاق
                  </p>
                  {isFree ? (
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">مجانية</p>
                  ) : (
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                      <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: ink }}>
                        {formatNumber(displayPrice)}
                      </span>
                      <span className="mb-1 text-sm font-bold" style={{ color: soft }}>
                        {currency}
                      </span>
                      {hasDiscount && (
                        <>
                          <span
                            className="mb-1 text-sm font-semibold text-rose-500 line-through dark:text-rose-400"
                          >
                            {formatNumber(originalPrice)} {currency}
                          </span>
                          <span className="mb-1 rounded-[6px] bg-rose-500/10 px-2 py-0.5 text-[11px] font-black text-rose-500 dark:text-rose-400">
                            -{discountPercent}%
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <SubscribeButtonHero onClick={isEnrolled ? onEnroll : onLogin} enrolled={isEnrolled} />
              </div>

              <div
                className="flex items-center gap-3 border-t px-4 py-3 sm:px-5"
                style={{ borderColor: line }}
              >
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-pressed={wishlisted}
                  aria-label={wishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  className={cn(
                    "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border text-xs font-black transition-colors duration-200 hover:opacity-80",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/40",
                  )}
                  style={{
                    borderColor: wishlisted ? `${PRIMARY}55` : line,
                    color: wishlisted ? PRIMARY : soft,
                    background: wishlisted ? `${PRIMARY}1a` : undefined,
                  }}
                >
                  <Heart
                    className={cn("h-4 w-4 transition-colors", wishlisted && "fill-[#BF6D58] text-[#BF6D58]")}
                    style={!wishlisted ? { color: PRIMARY } : undefined}
                  />
                  {wishlisted ? "في المفضلة" : "مفضلة"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="مشاركة الدورة"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/40"
                  style={{ borderColor: line, color: soft }}
                >
                  <Share2 className="h-4 w-4" style={{ color: PRIMARY }} />
                </button>

                <span className="hidden flex-1 items-center justify-end gap-1.5 text-[10px] font-semibold sm:inline-flex" style={{ color: faint }}>
                  <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                  ضمان استرداد خلال 30 يوم
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* bottom fade into page background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0c0e12, transparent)"
            : "linear-gradient(to top, hsl(42 20% 96%), transparent)",
        }}
      />
    </section>
  );
}

function SubscribeButtonHero({
  onClick,
  enrolled,
}: {
  onClick: () => void;
  enrolled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-sm font-black text-white transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enrolled
          ? "bg-emerald-600 shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          : "shadow-[0_10px_28px_rgba(191,109,88,0.35)] hover:brightness-110",
      )}
      style={enrolled ? undefined : { background: CTA_GRADIENT }}
    >
      <Crown className="h-4 w-4" />
      <span className="whitespace-nowrap">{enrolled ? "ابدأ التعلم الآن" : "اشترك الآن"}</span>
    </button>
  );
}

const CourseHero = memo(CourseHeroInner);

export { CourseHero };
export type { CourseHeroProps };
