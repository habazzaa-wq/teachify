"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  BookOpen,
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

function Stamp({
  label,
  tone,
  icon,
  rotate,
  paper,
}: {
  label: string;
  tone: string;
  icon: React.ReactNode;
  rotate: string;
  paper: string;
}) {
  return (
    <div
      className="flex h-[70px] w-[70px] flex-col items-center justify-center gap-0.5 rounded-full text-center"
      style={{
        background: paper,
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

  const P = "var(--brand-primary, #D87B63)";
  const PC = "var(--brand-primary-contrast, #fff)";
  const S = "var(--brand-secondary, #FFB50E)";
  const ink = isDark ? "#f6f0e6" : "#201a12";
  const soft = isDark ? "rgba(246,240,230,0.68)" : "#6e6254";
  const faint = isDark ? "rgba(246,240,230,0.45)" : "#978a79";
  const line = isDark ? "rgba(246,240,230,0.16)" : "rgba(32,26,18,0.14)";
  const paper = isDark ? "#171310" : "#fdfaf4";
  const paperSoft = isDark ? "#211c17" : "#f6f0e6";

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
          ? "linear-gradient(180deg, #15110e 0%, #13100d 60%, #110d0b 100%)"
          : "linear-gradient(180deg, #fbf7f1 0%, #f7f0e6 55%, #f3ebde 100%)",
      }}
    >
      {/* brand top band */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: P }} />

      {/* soft primary wash behind text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 w-1/2"
        style={{
          background: `linear-gradient(100deg, color-mix(in srgb, var(--brand-primary, #D87B63) 6%, transparent), transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
        {/* top editorial rule */}
        <div
          className="mb-10 flex items-center justify-between border-b pb-3 text-[10px] font-black uppercase tracking-[0.24em] sm:mb-14"
          style={{ borderColor: line, color: faint }}
        >
          <span>الأكاديمية الرقمية</span>
          <span className="hidden sm:inline">كتالوج الدورات</span>
          <span className="tabular-nums" dir="ltr">
            {String(course.lessonsCount).padStart(2, "0")} دروس
          </span>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
          {/* ── Text column ── */}
          <div className="relative flex flex-col gap-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-14 -start-2 hidden select-none text-[13rem] font-black leading-none md:block"
              style={{
                color: `color-mix(in srgb, var(--brand-primary, #D87B63) 9%, transparent)`,
              }}
            >
              {ghostLetter}
            </span>

            {/* eyebrow */}
            <motion.div {...fade(0.05)} className="relative flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-[11px] font-black"
                style={{ background: P, color: PC }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PC }} />
                {course.category?.name ?? "دورة احترافية"}
              </span>
              {course.difficulty && (
                <span
                  className="inline-flex items-center rounded-[8px] border px-3 py-1.5 text-[11px] font-black"
                  style={{
                    borderColor: `color-mix(in srgb, var(--brand-secondary, #FFB50E) 45%, transparent)`,
                    color: S,
                  }}
                >
                  {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
                </span>
              )}
              {course.educationalStage && (
                <span
                  className="hidden items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
                  style={{ borderColor: line, color: soft }}
                >
                  {course.educationalStage.name}
                </span>
              )}
            </motion.div>

            <motion.h1
              {...fade(0.12)}
              className="relative max-w-2xl text-balance text-[2.15rem] font-black leading-[1.13] tracking-tight sm:text-5xl"
              style={{ color: ink }}
            >
              {course.title}
              <span aria-hidden className="mt-4 block h-[11px] w-52 max-w-full sm:w-64">
                <svg viewBox="0 0 260 11" preserveAspectRatio="none" className="h-full w-full">
                  <path
                    d="M3 8C48 3 96 9 150 6c34-2 70 0 107-2"
                    stroke={P}
                    strokeWidth="3.2"
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
                <Users className="h-4 w-4" style={{ color: P }} />
                {formatNumber(course.studentsCount)} طالب
              </span>

              {course.duration != null && course.duration > 0 && (
                <>
                  <MetaSep color={line} />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4" style={{ color: S }} />
                    {formatDurationLong(course.duration)}
                  </span>
                </>
              )}

              <MetaSep color={line} />

              <span className="inline-flex items-center gap-1.5 font-medium">
                <BookOpen className="h-4 w-4" style={{ color: P }} />
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
                    className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[11px] font-bold"
                    style={{ borderColor: line, color: faint }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </motion.div>
            )}

            {/* desktop actions */}
            <motion.div {...fade(0.44)} className="relative hidden items-center gap-6 pt-1 lg:flex">
              <button
                type="button"
                onClick={handleWishlist}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                style={{ color: soft }}
              >
                <Heart
                  className={cn("h-4 w-4 transition-colors", wishlisted && "fill-current")}
                  style={{ color: wishlisted ? P : undefined }}
                />
                {wishlisted ? "في المفضلة" : "أضف إلى المفضلة"}
              </button>

              <MetaSep color={line} />

              <button
                type="button"
                onClick={handleShare}
                aria-label="مشاركة الدورة"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                style={{ color: soft }}
              >
                <Share2 className="h-4 w-4" style={{ color: P }} />
                مشاركة الدورة
              </button>
            </motion.div>
          </div>

          {/* ── Framed artwork column ── */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            {/* offset gold outline behind the frame */}
            <div
              aria-hidden
              className="pointer-events-none absolute -end-4 -top-4 h-32 w-32 border-2 sm:-end-6 sm:-top-6 sm:h-40 sm:w-40"
              style={{ borderColor: S, opacity: 0.55 }}
            />

            {/* frame */}
            <div className="relative">
              <div
                className="border p-2.5 sm:p-3.5"
                style={{ borderColor: line, background: paper, boxShadow: "0 28px 60px -24px rgba(0,0,0,0.35)" }}
              >
                {/* gold corner squares */}
                <span aria-hidden className="absolute -top-1.5 -start-1.5 h-3 w-3" style={{ background: S }} />
                <span aria-hidden className="absolute -top-1.5 -end-1.5 h-3 w-3" style={{ background: S }} />
                <span aria-hidden className="absolute -bottom-1.5 -start-1.5 h-3 w-3" style={{ background: S }} />
                <span aria-hidden className="absolute -bottom-1.5 -end-1.5 h-3 w-3" style={{ background: S }} />

                {/* primary molding */}
                <div
                  className="p-2 sm:p-2.5"
                  style={{ background: P, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.07)" }}
                >
                  {/* secondary inner lip */}
                  <div className="p-[3px]" style={{ background: S }}>
                    {/* artwork */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={course.title}
                          fill
                          sizes="(max-width: 1024px) 90vw, 520px"
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${P}, ${S})` }}
                        >
                          <BookOpen className="h-16 w-16" style={{ color: "rgba(255,255,255,0.85)" }} />
                        </div>
                      )}
                      {/* legibility shade */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ background: "linear-gradient(180deg, transparent 58%, rgba(0,0,0,0.32) 100%)" }}
                      />
                      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/20" />
                    </div>
                  </div>
                </div>

                {/* caption bar inside the mat */}
                <div
                  className="mt-2.5 flex items-center justify-between gap-3 border-t pt-2.5 sm:mt-3.5 sm:pt-3"
                  style={{ borderColor: line }}
                >
                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: P }}
                  >
                    <span className="h-1.5 w-1.5" style={{ background: S }} />
                    {course.category?.name ?? "دورة احترافية"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: faint }}>
                    {String(course.lessonsCount).padStart(2, "0")} دروس
                  </span>
                </div>
              </div>
            </div>

            {/* rating label on the artwork */}
            <div
              className="absolute bottom-14 start-3 z-10 flex items-center gap-2 rounded-[8px] border px-3 py-2 sm:bottom-16"
              style={{ background: paper, borderColor: line, boxShadow: "0 8px 18px rgba(0,0,0,0.14)" }}
            >
              <RatingStars rating={rating} size={13} />
              <span className="text-sm font-black tabular-nums" style={{ color: ink }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: soft }}>
                {formatNumber(course.studentsCount)} تقييم
              </span>
            </div>

            {/* free stamp */}
            {isFree && (
              <div className="absolute -top-3 -end-3 z-20 sm:-top-4 sm:-end-4">
                <Stamp
                  label="مجانية"
                  tone="#059669"
                  rotate="9deg"
                  paper={paper}
                  icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
                />
              </div>
            )}

            {/* ── Mobile price + subscribe card ── */}
            <div className="mt-9 lg:hidden">
              <div
                className="flex items-center justify-between gap-4 rounded-[14px] border p-4 sm:p-5"
                style={{ borderColor: line, background: paper, boxShadow: "0 18px 40px -26px rgba(30,20,10,0.4)" }}
              >
                <div className="min-w-0">
                  <p
                    className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: faint }}
                  >
                    سعر الالتحاق
                  </p>
                  {isFree ? (
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">مجانية</p>
                  ) : (
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                      <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: P }}>
                        {formatNumber(displayPrice)}
                      </span>
                      <span className="mb-1 text-sm font-bold" style={{ color: soft }}>
                        {currency}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="mb-1 text-sm font-semibold text-rose-500 line-through dark:text-rose-400">
                            {formatNumber(originalPrice)} {currency}
                          </span>
                          <span
                            className="mb-1 rounded-[6px] px-2 py-0.5 text-[11px] font-black"
                            style={{ background: `color-mix(in srgb, var(--brand-secondary, #FFB50E) 22%, transparent)`, color: "#8a5a00" }}
                          >
                            خصم {discountPercent}%
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <SubscribeButtonHero onClick={isEnrolled ? onEnroll : onLogin} enrolled={isEnrolled} />
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-pressed={wishlisted}
                  aria-label={wishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border text-xs font-black transition-colors duration-200 hover:opacity-80"
                  style={{
                    borderColor: wishlisted ? P : line,
                    color: wishlisted ? P : soft,
                    background: wishlisted ? `color-mix(in srgb, var(--brand-primary, #D87B63) 12%, transparent)` : paperSoft,
                  }}
                >
                  <Heart className={cn("h-4 w-4 transition-colors", wishlisted && "fill-current")} />
                  {wishlisted ? "في المفضلة" : "مفضلة"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="مشاركة الدورة"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors hover:opacity-80"
                  style={{ borderColor: line, color: soft, background: paperSoft }}
                >
                  <Share2 className="h-4 w-4" style={{ color: P }} />
                </button>

                <span
                  className="hidden flex-1 items-center justify-end gap-1.5 text-[10px] font-semibold sm:inline-flex"
                  style={{ color: faint }}
                >
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
  const cta = "linear-gradient(135deg, var(--brand-primary, #D87B63), color-mix(in srgb, var(--brand-primary, #D87B63) 74%, #000))";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-sm font-black transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#D87B63)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enrolled
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          : "hover:brightness-110",
      )}
      style={
        enrolled
          ? undefined
          : {
              background: cta,
              color: "var(--brand-primary-contrast, #fff)",
              boxShadow: "0 10px 28px color-mix(in srgb, var(--brand-primary, #D87B63) 35%, transparent)",
            }
      }
    >
      <Crown className="h-4 w-4" />
      <span className="whitespace-nowrap">{enrolled ? "ابدأ التعلم الآن" : "اشترك الآن"}</span>
    </button>
  );
}

const CourseHero = memo(CourseHeroInner);

export { CourseHero };
export type { CourseHeroProps };
