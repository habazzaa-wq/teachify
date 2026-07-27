"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Globe,
  Award,
  CalendarDays,
  Signal,
  ArrowLeft,
  Crown,
  Play,
  Shield,
  Smartphone,
  Download,
  ClipboardCheck,
  RefreshCw,
  Check,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber } from "@/lib/format";
import type { PublicCourse } from "../types";

const PRIMARY = "#BF6D58";
const ACCENT = "#FFB50E";

const difficultyLabel: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/20",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/20",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-400/20",
  all_levels: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400/20",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ""}`;
  return `${m} دقيقة`;
}

function RatingStars({ rating }: { rating?: number | null }) {
  const value = rating ?? 4.8;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.floor(value)
              ? "fill-amber-400 text-amber-400"
              : i < value
                ? "fill-amber-400/50 text-amber-400/50"
                : "fill-muted-foreground/15 text-muted-foreground/15",
          )}
        />
      ))}
      <span className="me-1 text-sm font-bold text-amber-500 dark:text-amber-400">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

interface HeroSectionProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
  onLogin: () => void;
}

function HeroSectionInner({
  course,
  isEnrolled,
  onEnroll,
  onLogin,
}: HeroSectionProps) {
  const theme = useUiStore((s) => s.theme);
  const prefersReduced = useReducedMotion();
  const isDark = theme === "dark";

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  } as const);

  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const discountPercent =
    hasDiscount && originalPrice
      ? Math.round(
          ((originalPrice - (course.discountPrice ?? 0)) / originalPrice) * 100,
        )
      : 0;

  const includes = [
    { icon: Shield, text: "صول دائم" },
    { icon: Smartphone, text: "صول عبر الهاتف" },
    { icon: Download, text: "ملفات قابلة للتحميل" },
    { icon: ClipboardCheck, text: "اختبارات وتمارين" },
    { icon: Award, text: "شهادة إتمام" },
    { icon: RefreshCw, text: "تحديثات مستقبلية" },
  ];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden" style={{ minHeight: "clamp(480px, 60vw, 680px)" }}>
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0c0e12 0%, #101218 40%, #14171e 70%, #181b24 100%)"
            : "linear-gradient(180deg, #FAF8F5 0%, #F7F4EF 40%, #F3EFE8 70%, #EFE9E0 100%)",
        }}
      />

      {/* Cover image */}
      {course.coverImage && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.coverImage}
            alt={course.title}
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "linear-gradient(180deg, rgba(12,14,18,0.15) 0%, rgba(12,14,18,0.45) 30%, rgba(12,14,18,0.85) 60%, rgba(12,14,18,0.98) 100%)"
                : "linear-gradient(180deg, rgba(250,248,245,0.0) 0%, rgba(250,248,245,0.3) 30%, rgba(250,248,245,0.8) 60%, rgba(250,248,245,0.98) 100%)",
            }}
          />
        </motion.div>
      )}

      {/* Decorative orbs when no cover */}
      {!course.coverImage && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${PRIMARY}25 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${ACCENT}20 0%, transparent 50%)`,
            }}
          />
        </div>
      )}

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { x: "8%", y: "12%", size: 220, color: PRIMARY, opacity: 0.06 },
          { x: "82%", y: "18%", size: 180, color: ACCENT, opacity: 0.04 },
          { x: "5%", y: "78%", size: 160, color: ACCENT, opacity: 0.03 },
          { x: "88%", y: "72%", size: 200, color: PRIMARY, opacity: 0.05 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.7 }}
            animate={
              prefersReduced
                ? { opacity: orb.opacity }
                : { opacity: orb.opacity, scale: [0.7, 1.05, 0.85, 1] }
            }
            transition={{
              duration: 14 + i * 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}40, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-14 lg:items-start">
          {/* Left: Text */}
          <div className="flex flex-col gap-5">
            {/* Badges */}
            <motion.div {...fadeUp(0.1)} className="flex flex-wrap items-center gap-2.5">
              {course.category && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
                    isDark
                      ? "border-white/10 bg-white/8 text-white/80"
                      : "border-black/8 bg-white/70 text-gray-700 shadow-sm",
                  )}
                >
                  {course.category.name}
                </span>
              )}
              {course.difficulty && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
                    difficultyColor[course.difficulty],
                  )}
                >
                  <Signal className="h-3 w-3" />
                  {difficultyLabel[course.difficulty] ?? course.difficulty}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              {...fadeUp(0.15)}
              className={cn(
                "max-w-4xl text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.2] tracking-tight",
                isDark ? "text-white" : "text-gray-900",
              )}
            >
              {course.title}
            </motion.h1>

            {/* Subtitle */}
            {course.subtitle && (
              <motion.p
                {...fadeUp(0.2)}
                className={cn(
                  "max-w-3xl text-base sm:text-lg font-medium leading-relaxed",
                  isDark ? "text-white/65" : "text-gray-500",
                )}
              >
                {course.subtitle}
              </motion.p>
            )}

            {/* Meta row */}
            <motion.div
              {...fadeUp(0.3)}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm",
                isDark ? "text-white/50" : "text-gray-500",
              )}
            >
              <RatingStars rating={4.8} />
              <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">{formatNumber(course.studentsCount)} طالب</span>
              </div>
              <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
              {course.duration != null && course.duration > 0 && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="font-medium">{formatDuration(course.duration)}</span>
                  </div>
                  <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
                </>
              )}
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">{formatNumber(course.lessonsCount)} درس</span>
              </div>
              <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="font-medium">{course.language || "العربية"}</span>
              </div>
              {course.certificateEnabled && (
                <>
                  <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="font-medium text-amber-600 dark:text-amber-400">شهادة إتمام</span>
                  </div>
                </>
              )}
              <span className={cn("hidden sm:block h-4 w-px", isDark ? "bg-white/10" : "bg-gray-300/60")} />
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="font-medium">آخر تحديث: {formatDate(course.updatedAt)}</span>
              </div>
            </motion.div>

            {/* Mobile CTA */}
            <motion.div {...fadeUp(0.35)} className="flex lg:hidden items-center gap-3 pt-1">
              <motion.button
                whileHover={prefersReduced ? {} : { scale: 1.03, y: -1 }}
                whileTap={prefersReduced ? {} : { scale: 0.97 }}
                onClick={isEnrolled ? onEnroll : onLogin}
                className={cn(
                  "group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-shadow duration-300",
                  "shadow-[0_8px_32px_rgba(191,109,88,0.35)]",
                  "hover:shadow-[0_12px_48px_rgba(191,109,88,0.5)]",
                )}
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}dd, #a85a48)`,
                }}
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {isEnrolled ? (
                  <>
                    <Play className="relative h-4 w-4 fill-current" />
                    <span className="relative">ابدأ التعلم</span>
                  </>
                ) : (
                  <>
                    <Crown className="relative h-4 w-4" />
                    <span className="relative">اشترك الآن</span>
                    <ArrowLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Right: Desktop purchase card */}
          <motion.div {...fadeUp(0.2)} className="hidden lg:block">
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border backdrop-blur-xl",
                isDark
                  ? "border-white/10 bg-background/80 shadow-2xl shadow-black/30"
                  : "border-neutral-200/80 bg-white/80 shadow-2xl shadow-neutral-900/10",
              )}
            >
              {/* Accent gradient bar */}
              <div className="h-1.5 w-full bg-gradient-to-l from-[#BF6D58] via-[#d4856f] to-[#FFB50E]" />

              {/* Glow orbs */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full opacity-15 blur-3xl bg-[#BF6D58]" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full opacity-10 blur-3xl bg-[#FFB50E]" />

              <div className="relative p-6">
                {/* Price */}
                <div className="mb-5">
                  {isFree ? (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-emerald-500">مجاني</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Star className="h-3 w-3 fill-current" />
                        مجاني
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-end gap-3">
                      <span className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-neutral-900")}>
                        {formatNumber(displayPrice)}
                      </span>
                      {course.currency && (
                        <span className={cn("mb-1 text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-500")}>
                          {course.currency}
                        </span>
                      )}
                      {hasDiscount && (
                        <>
                          <span className={cn("mb-1 text-base line-through", isDark ? "text-neutral-500" : "text-neutral-400")}>
                            {formatNumber(originalPrice)}
                          </span>
                          <span className="mb-1 rounded-lg bg-[#FFB50E]/15 px-2.5 py-0.5 text-xs font-bold text-[#FFB50E]">
                            -{discountPercent}%
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
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
                          isDark && "focus-visible:ring-offset-neutral-900",
                        )
                      : cn(
                          "bg-gradient-to-l from-[#BF6D58] to-[#a85a47] text-white",
                          "hover:from-[#a85a47] hover:to-[#BF6D58] shadow-lg shadow-[#BF6D58]/25",
                          "hover:shadow-xl hover:shadow-[#BF6D58]/30",
                          "focus-visible:ring-[#BF6D58]",
                          isDark && "focus-visible:ring-offset-neutral-900",
                        ),
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

                  {!isEnrolled && (
                    <span className="absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </span>
                  )}
                </motion.button>

                {/* Divider */}
                <div className={cn("mb-5 h-px w-full", isDark ? "bg-white/10" : "bg-neutral-200")} />

                {/* Includes */}
                <h4 className={cn("mb-3 text-sm font-semibold", isDark ? "text-neutral-300" : "text-neutral-600")}>
                  يتضمن الدورة
                </h4>
                <ul className="space-y-2.5">
                  {includes.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#BF6D58]/10">
                        <Check className="h-3 w-3 text-[#BF6D58]" strokeWidth={3} />
                      </span>
                      <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-600")}>
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Stats footer */}
                <div className={cn("mt-5 flex items-center justify-center gap-1 rounded-xl px-4 py-2.5", isDark ? "bg-white/5" : "bg-neutral-50")}>
                  <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                    {formatNumber(course.studentsCount)} طالب مسجّل
                  </span>
                  <span className={cn("mx-1.5 text-xs", isDark ? "text-neutral-600" : "text-neutral-300")}>•</span>
                  <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                    {formatNumber(course.lessonsCount)} درس
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to top, hsl(var(--background)), transparent)"
            : "linear-gradient(to top, hsl(var(--background)), transparent)",
        }}
      />
    </section>
  );
}

export const HeroSection = memo(HeroSectionInner);
