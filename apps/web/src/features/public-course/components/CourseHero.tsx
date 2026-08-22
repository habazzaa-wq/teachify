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
  Signal,
  GraduationCap,
  Landmark,
  Sparkles,
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useUiStore } from "@/stores/ui.store";
import { formatDurationLong } from "../utils";
import {
  ACCENT,
  ACCENT_GRADIENT,
  CTA_GRADIENT,
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PRIMARY,
} from "../brand";
import type { PublicCourse } from "../types";

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
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
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

function HeroBadge({
  icon,
  label,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "brand" | "accent" | "neutral" | "success";
}) {
  const tones = {
    brand:
      "border-[#BF6D58]/25 bg-[#BF6D58]/12 text-[#BF6D58] dark:border-[#BF6D58]/30 dark:bg-[#BF6D58]/15 dark:text-[#ffd6c9]",
    accent:
      "border-[#FFB50E]/30 bg-[#FFB50E]/12 text-[#b45309] dark:border-[#FFB50E]/30 dark:bg-[#FFB50E]/12 dark:text-[#FFB50E]",
    neutral:
      "border-border/60 bg-background/70 text-muted-foreground dark:bg-white/[0.04]",
    success:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold",
        tones[tone],
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

function CourseHeroInner({
  course,
  isEnrolled,
  onEnroll,
  onLogin,
}: CourseHeroProps) {
  const theme = useUiStore((s) => s.theme);
  const prefersReduced = useReducedMotion();
  const isDark = theme === "dark";
  const [wishlisted, setWishlisted] = useState(false);

  const rating = 4.8;
  const hasDiscount =
    !isEnrolled &&
    course.pricingType !== "free" &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;
  const displayPrice = course.pricingType === "free" ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - course.discountPrice!) / originalPrice) * 100)
    : 0;
  const currency = "ج.م";

  const coverSrc = course.coverImage || course.thumbnail;

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
    initial: { opacity: 0, y: prefersReduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  const isFree = course.pricingType === "free";

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ minHeight: "clamp(640px, 78vw, 760px)" }}
    >
      {/* ── Warm branded background ── */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0c0e12 0%, #0f1116 34%, #131019 70%, #160e0e 100%)"
            : "linear-gradient(180deg, #faf6f1 0%, #f7f1ea 36%, #f3ecdf 72%, #f7e8dd 100%)",
        }}
      />

      {/* subtle radial color washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(700px 420px at 82% 12%, ${PRIMARY}26, transparent 60%), radial-gradient(520px 360px at 8% 88%, ${ACCENT}14, transparent 60%)`
            : `radial-gradient(720px 440px at 82% 10%, ${PRIMARY}14, transparent 62%), radial-gradient(540px 380px at 8% 90%, ${ACCENT}12, transparent 62%)`,
        }}
      />

      {/* decorative floating orbs — transform/opacity only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "12%", left: "6%", size: 220, color: PRIMARY, delay: 0 },
          { top: "70%", right: "8%", size: 180, color: ACCENT, delay: 1.4 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.left,
              right: orb.right,
              top: orb.top,
              background: `radial-gradient(circle, ${orb.color}40, transparent 70%)`,
            }}
            initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0, scale: 0.7 }}
            animate={
              prefersReduced
                ? { opacity: 0.5 }
                : {
                    opacity: 0.55,
                    scale: [0.7, 1.15, 0.9, 1],
                    y: [0, -14, 8, 0],
                  }
            }
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          />
        ))}
      </div>

      {/* subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_440px] lg:gap-14">
          {/* ── Text column (right in RTL) ── */}
          <div className="flex flex-col gap-5">
            <motion.div {...fade(0.05)} className="flex flex-wrap items-center gap-2">
              {course.category && (
                <HeroBadge
                  tone="brand"
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                  label={course.category.name}
                />
              )}
              {course.difficulty && (
                <HeroBadge
                  tone="accent"
                  icon={<Signal className="h-3.5 w-3.5" />}
                  label={DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
                />
              )}
              {course.educationalStage && (
                <HeroBadge
                  tone="neutral"
                  icon={<Landmark className="h-3.5 w-3.5" />}
                  label={course.educationalStage.name}
                />
              )}
              {course.subject && (
                <HeroBadge
                  tone="neutral"
                  icon={<BookOpen className="h-3.5 w-3.5" />}
                  label={course.subject.name}
                />
              )}
            </motion.div>

            <motion.h1
              {...fade(0.12)}
              className="max-w-3xl text-balance text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]"
              style={{ color: isDark ? "#faf6f1" : "#221a12" }}
            >
              {course.title}
            </motion.h1>

            {course.subtitle && (
              <motion.p
                {...fade(0.18)}
                className="max-w-2xl text-lg font-semibold leading-relaxed sm:text-xl"
                style={{ color: isDark ? "rgba(250,246,241,0.72)" : "#5b5147" }}
              >
                {course.subtitle}
              </motion.p>
            )}

            {course.shortDescription && (
              <motion.p
                {...fade(0.24)}
                className="max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: isDark ? "rgba(250,246,241,0.5)" : "#7c7166" }}
              >
                {course.shortDescription}
              </motion.p>
            )}

            {/* meta row */}
            <motion.div
              {...fade(0.3)}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
              style={{ color: isDark ? "rgba(250,246,241,0.6)" : "#6b6156" }}
            >
              <div className="flex items-center gap-2">
                <RatingStars rating={rating} />
                <span className="font-bold text-amber-500">{rating.toFixed(1)}</span>
                <span className="text-xs opacity-70">({formatNumber(course.studentsCount)} تقييم)</span>
              </div>

              <span className="hidden h-4 w-px sm:block" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />

              <span className="inline-flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4" style={{ color: PRIMARY }} />
                {formatNumber(course.studentsCount)} طالب
              </span>

              {course.duration != null && course.duration > 0 && (
                <>
                  <span className="hidden h-4 w-px sm:block" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4" style={{ color: ACCENT }} />
                    {formatDurationLong(course.duration)}
                  </span>
                </>
              )}

              <span className="hidden h-4 w-px sm:block" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
              <span className="inline-flex items-center gap-1.5 font-medium">
                <BookOpen className="h-4 w-4" style={{ color: PRIMARY }} />
                {formatNumber(course.lessonsCount)} درس
              </span>

              <span className="hidden h-4 w-px sm:block" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
              <span className="inline-flex items-center gap-1.5 font-medium">
                {LANGUAGE_LABELS[course.language] ?? course.language}
              </span>
            </motion.div>

            {/* tags */}
            {course.tags.length > 0 && (
              <motion.div {...fade(0.34)} className="flex flex-wrap gap-2">
                {course.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1"
                    style={{
                      color: isDark ? "rgba(250,246,241,0.45)" : "#8a7f73",
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </motion.div>
            )}

            {course.certificateEnabled && (
              <motion.div {...fade(0.38)}>
                <HeroBadge
                  tone="success"
                  icon={<Award className="h-3.5 w-3.5" />}
                  label="شهادة إتمام معتمدة"
                />
              </motion.div>
            )}
          </div>

          {/* ── Image column with floating card + purchase ── */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            {/* image card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/40 shadow-2xl shadow-black/10 dark:border-white/10">
              <div className="relative aspect-[4/3] w-full">
                {coverSrc ? (
                  <Image
                    src={coverSrc}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 90vw, 440px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY}2a, ${ACCENT}14)`,
                    }}
                  >
                    <BookOpen className="h-20 w-20" style={{ color: `${PRIMARY}55` }} />
                  </div>
                )}
                {/* legibility gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.45) 100%)",
                  }}
                />

                {/* floating rating card */}
                <div
                  className="absolute bottom-4 start-4 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 px-4 py-3 shadow-lg shadow-black/10"
                  style={{ backdropFilter: "none" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold text-white shadow-md"
                    style={{ background: CTA_GRADIENT }}
                  >
                    {rating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={rating} size={12} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-gray-600">
                      تقييم {formatNumber(course.studentsCount)} طالب
                    </p>
                  </div>
                </div>

                {/* floating certificate badge */}
                {course.certificateEnabled && (
                  <div
                    className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
                    style={{ background: ACCENT_GRADIENT, boxShadow: "0 6px 20px rgba(245,158,11,0.4)" }}
                  >
                    <Award className="h-3.5 w-3.5" />
                    شهادة معتمدة
                  </div>
                )}
              </div>
            </div>

            {/* ── Price + Subscribe + Actions (mobile only; sidebar handles lg+) ── */}
            <div className="mt-5 rounded-3xl border border-border/60 bg-background/80 p-5 shadow-lg shadow-black/5 dark:bg-white/[0.03] sm:p-6 lg:hidden">
              {isFree ? (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">مجاني</span>
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
              ) : (
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {formatNumber(displayPrice)}
                  </span>
                  <span className="mb-1 text-sm font-semibold text-muted-foreground">{currency}</span>
                  {hasDiscount && (
                    <>
                      <span className="mb-1 text-base text-muted-foreground line-through">
                        {formatNumber(originalPrice)} {currency}
                      </span>
                      <span
                        className="mb-1 rounded-lg px-2.5 py-0.5 text-xs font-extrabold"
                        style={{ background: `${ACCENT}22`, color: "#b45309" }}
                      >
                        خصم {discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              )}

              <SubscribeButtonHero onClick={isEnrolled ? onEnroll : onLogin} enrolled={isEnrolled} />

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-pressed={wishlisted}
                  aria-label={wishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  className={cn(
                    "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/40",
                    wishlisted
                      ? "border-[#BF6D58]/30 bg-[#BF6D58]/10 text-[#BF6D58]"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart
                    className={cn("h-4.5 w-4.5 transition-colors", wishlisted && "fill-[#BF6D58] text-[#BF6D58]")}
                    style={{ width: 18, height: 18 }}
                  />
                  {wishlisted ? "في المفضلة" : "مفضلة"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="مشاركة الدورة"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/40"
                >
                  <Share2 className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                ضمان استرداد الأموال خلال 30 يوماً
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* bottom fade into page background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
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
        "group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-4 text-base font-extrabold text-white transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enrolled
          ? "bg-emerald-600 shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          : "shadow-[0_10px_32px_rgba(191,109,88,0.4)] hover:shadow-[0_14px_44px_rgba(191,109,88,0.5)]",
      )}
      style={enrolled ? undefined : { background: CTA_GRADIENT }}
    >
      <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Crown className="relative h-5 w-5" />
      <span className="relative">{enrolled ? "ابدأ التعلم الآن" : "اشترك الآن وابدأ التعلم"}</span>
    </button>
  );
}

const CourseHero = memo(CourseHeroInner);

export { CourseHero };
export type { CourseHeroProps };
