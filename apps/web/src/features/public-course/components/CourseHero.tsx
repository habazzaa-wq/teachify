"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Globe,
  Award,
  CalendarDays,
  Tag,
  Heart,
  ArrowLeft,
  Signal,
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
  beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  intermediate: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  advanced: "bg-rose-500/20 text-rose-300 border-rose-400/30",
  all_levels: "bg-sky-500/20 text-sky-300 border-sky-400/30",
};

const difficultyLabelDark: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-400/20",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-400/20",
  advanced: "bg-rose-500/15 text-rose-400 border-rose-400/20",
  all_levels: "bg-sky-500/15 text-sky-400 border-sky-400/20",
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
            "h-3.5 w-3.5",
            i < Math.floor(value)
              ? "fill-amber-400 text-amber-400"
              : i < value
                ? "fill-amber-400/50 text-amber-400/50"
                : "fill-white/10 text-white/10",
          )}
        />
      ))}
      <span className="me-1 text-xs font-bold text-amber-400">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

const orbs = [
  { x: "8%", y: "12%", size: 180, color: PRIMARY, opacity: 0.15, duration: 14 },
  { x: "82%", y: "18%", size: 140, color: ACCENT, opacity: 0.12, duration: 16 },
  { x: "5%", y: "78%", size: 120, color: ACCENT, opacity: 0.10, duration: 12 },
  { x: "88%", y: "70%", size: 160, color: PRIMARY, opacity: 0.13, duration: 15 },
  { x: "45%", y: "90%", size: 100, color: PRIMARY, opacity: 0.08, duration: 18 },
];

const floatingDots = [
  { x: "12%", y: "18%", s: 4, delay: 0 },
  { x: "88%", y: "22%", s: 5, delay: 0.8 },
  { x: "6%", y: "55%", s: 4, delay: 1.2 },
  { x: "92%", y: "50%", s: 3, delay: 0.5 },
  { x: "20%", y: "85%", s: 5, delay: 2 },
  { x: "78%", y: "82%", s: 4, delay: 1.5 },
  { x: "35%", y: "8%", s: 3, delay: 0.3 },
  { x: "62%", y: "92%", s: 4, delay: 2.2 },
];

export function CourseHero({ course }: { course: PublicCourse }) {
  const theme = useUiStore((s) => s.theme);
  const prefersReduced = useReducedMotion();
  const isDark = theme === "dark";

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  } as const);

  const scaleIn = (delay = 0) => ({
    initial: { opacity: 0, scale: prefersReduced ? 1 : 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  } as const);

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ minHeight: "clamp(520px, 70vw, 720px)" }}
    >
      {/* ── Base gradient background ── */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0c0e12 0%, #101218 30%, #14171e 60%, #181b24 100%)"
            : "linear-gradient(180deg, #faf8f5 0%, #f7f4ef 30%, #f3efe8 60%, #efe9e0 100%)",
        }}
      />

      {/* ── Cover image layer ── */}
      {course.coverImage && (
        <motion.div {...scaleIn(0)} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.coverImage}
            alt={course.title}
            className="h-full w-full object-cover"
          />
          {/* Multi-layer gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "linear-gradient(180deg, rgba(12,14,18,0.3) 0%, rgba(12,14,18,0.55) 30%, rgba(12,14,18,0.82) 60%, rgba(12,14,18,0.97) 100%)"
                : "linear-gradient(180deg, rgba(250,248,245,0.15) 0%, rgba(250,248,245,0.4) 30%, rgba(250,248,245,0.78) 60%, rgba(250,248,245,0.97) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "linear-gradient(to left, rgba(12,14,18,0.7) 0%, transparent 50%)"
                : "linear-gradient(to left, rgba(250,248,245,0.6) 0%, transparent 50%)",
            }}
          />
        </motion.div>
      )}

      {/* ── Fallback gradient placeholder when no cover ── */}
      {!course.coverImage && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${PRIMARY}30 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${ACCENT}25 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, ${PRIMARY}10 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* ── Animated orbs ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {orbs.map((orb, i) => (
          <motion.div
            key={`orb-${i}`}
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.6 }}
            animate={
              prefersReduced
                ? { opacity: orb.opacity * (isDark ? 0.5 : 1) }
                : {
                    opacity: orb.opacity * (isDark ? 0.5 : 1),
                    scale: [0.6, 1.1, 0.8, 1],
                    x: [0, 15, -10, 0],
                    y: [0, -10, 8, 0],
                  }
            }
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.6,
            }}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}50, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
        ))}
      </div>

      {/* ── Floating dots ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {floatingDots.map((d, i) => (
          <motion.div
            key={`dot-${i}`}
            initial={prefersReduced ? { opacity: 0.2 } : { opacity: 0, scale: 0 }}
            animate={
              prefersReduced
                ? { opacity: 0.2 }
                : {
                    opacity: [0, 0.25, 0],
                    scale: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: 5 + (i % 3) * 2,
              repeat: Infinity,
              delay: d.delay,
              ease: "easeInOut",
            }}
            className="absolute rounded-full"
            style={{
              left: d.x,
              top: d.y,
              width: d.s,
              height: d.s,
              backgroundColor: i % 2 === 0 ? PRIMARY : ACCENT,
            }}
          />
        ))}
      </div>

      {/* ── Decorative ring outlines ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 0.06 } : { opacity: 0, scale: 0.8, rotate: 0 }}
          animate={
            prefersReduced
              ? { opacity: 0.06 }
              : { opacity: 0.06, scale: 1, rotate: 360 }
          }
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full border"
          style={{
            left: "10%",
            top: "15%",
            width: 300,
            height: 300,
            borderColor: isDark
              ? "rgba(191,109,88,0.12)"
              : "rgba(191,109,88,0.18)",
          }}
        />
        <motion.div
          initial={prefersReduced ? { opacity: 0.04 } : { opacity: 0, scale: 0.8, rotate: 0 }}
          animate={
            prefersReduced
              ? { opacity: 0.04 }
              : { opacity: 0.04, scale: 1, rotate: -360 }
          }
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full border"
          style={{
            right: "5%",
            top: "20%",
            width: 220,
            height: 220,
            borderColor: isDark
              ? "rgba(255,181,14,0.08)"
              : "rgba(255,181,14,0.14)",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── Content ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* ── Badges row: Category + Difficulty ── */}
          <motion.div {...fadeUp(0.1)} className="flex flex-wrap items-center gap-3">
            {course.category && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
                  isDark
                    ? "border-white/10 bg-white/8 text-white/80"
                    : "border-black/8 bg-white/70 text-gray-700 shadow-sm",
                )}
              >
                <Tag className="h-3 w-3" />
                {course.category.name}
              </span>
            )}
            {course.difficulty && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
                  isDark
                    ? difficultyLabelDark[course.difficulty]
                    : difficultyColor[course.difficulty],
                )}
              >
                <Signal className="h-3 w-3" />
                {difficultyLabel[course.difficulty] ?? course.difficulty}
              </span>
            )}
          </motion.div>

          {/* ── Tags row ── */}
          {course.tags.length > 0 && (
            <motion.div {...fadeUp(0.15)} className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-sm",
                    isDark
                      ? "bg-white/5 text-white/50 ring-1 ring-white/8"
                      : "bg-black/4 text-gray-500 ring-1 ring-black/6",
                  )}
                >
                  #{tag.name}
                </span>
              ))}
            </motion.div>
          )}

          {/* ── Title ── */}
          <motion.h1
            {...fadeUp(0.2)}
            className={cn(
              "max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight",
              isDark ? "text-white" : "text-gray-900",
            )}
          >
            {course.title}
          </motion.h1>

          {/* ── Subtitle ── */}
          {course.subtitle && (
            <motion.p
              {...fadeUp(0.25)}
              className={cn(
                "max-w-3xl text-lg sm:text-xl font-semibold leading-relaxed",
                isDark ? "text-white/70" : "text-gray-600",
              )}
            >
              {course.subtitle}
            </motion.p>
          )}

          {/* ── Short description ── */}
          {course.shortDescription && (
            <motion.p
              {...fadeUp(0.3)}
              className={cn(
                "max-w-3xl text-sm sm:text-base leading-relaxed",
                isDark ? "text-white/50" : "text-gray-500",
              )}
            >
              {course.shortDescription}
            </motion.p>
          )}

          {/* ── Meta row ── */}
          <motion.div
            {...fadeUp(0.35)}
            className={cn(
              "flex flex-wrap items-center gap-x-5 gap-y-3 text-sm",
              isDark ? "text-white/55" : "text-gray-500",
            )}
          >
            {/* Rating */}
            <div className="flex items-center gap-2">
              <RatingStars rating={4.8} />
            </div>

            <span
              className={cn(
                "hidden sm:block h-4 w-px",
                isDark ? "bg-white/10" : "bg-gray-300/60",
              )}
            />

            {/* Students */}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 shrink-0" style={{ color: PRIMARY }} />
              <span className="font-medium">
                {formatNumber(course.studentsCount)} طالب
              </span>
            </div>

            <span
              className={cn(
                "hidden sm:block h-4 w-px",
                isDark ? "bg-white/10" : "bg-gray-300/60",
              )}
            />

            {/* Duration */}
            {course.duration && (
              <>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="font-medium">
                    {formatDuration(course.duration)}
                  </span>
                </div>
                <span
                  className={cn(
                    "hidden sm:block h-4 w-px",
                    isDark ? "bg-white/10" : "bg-gray-300/60",
                  )}
                />
              </>
            )}

            {/* Lessons */}
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 shrink-0" style={{ color: PRIMARY }} />
              <span className="font-medium">
                {formatNumber(course.lessonsCount)} درس
              </span>
            </div>

            <span
              className={cn(
                "hidden sm:block h-4 w-px",
                isDark ? "bg-white/10" : "bg-gray-300/60",
              )}
            />

            {/* Language */}
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="font-medium">{course.language || "العربية"}</span>
            </div>

            {/* Certificate badge */}
            {course.certificateEnabled && (
              <>
                <span
                  className={cn(
                    "hidden sm:block h-4 w-px",
                    isDark ? "bg-white/10" : "bg-gray-300/60",
                  )}
                />
                <div className="flex items-center gap-1.5">
                  <Award
                    className="h-4 w-4 shrink-0"
                    style={{ color: ACCENT }}
                  />
                  <span
                    className="font-medium"
                    style={{ color: ACCENT }}
                  >
                    شهادة إتمام
                  </span>
                </div>
              </>
            )}

            {/* Updated date */}
            <span
              className={cn(
                "hidden sm:block h-4 w-px",
                isDark ? "bg-white/10" : "bg-gray-300/60",
              )}
            />
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="font-medium">
                آخر تحديث: {formatDate(course.updatedAt)}
              </span>
            </div>
          </motion.div>

          {/* ── CTA buttons ── */}
          <motion.div
            {...fadeUp(0.4)}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            {/* Primary CTA */}
            <motion.button
              whileHover={
                prefersReduced ? {} : { scale: 1.03, y: -1 }
              }
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
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
              <span className="relative">اشترك الآن</span>
              <ArrowLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              whileHover={
                prefersReduced ? {} : { scale: 1.03, y: -1 }
              }
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-2xl border px-7 py-3.5 text-sm font-bold backdrop-blur-sm transition-all duration-300",
                isDark
                  ? "border-white/12 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/8 hover:text-white"
                  : "border-gray-300/60 bg-white/60 text-gray-700 hover:border-gray-400 hover:bg-white/80 hover:text-gray-900 shadow-sm hover:shadow-md",
              )}
            >
              <Heart
                className="h-4 w-4 transition-colors duration-300"
                style={{ color: ACCENT }}
              />
              <span>إضافة للمفضلة</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom fade ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0c0e12, transparent)"
            : "linear-gradient(to top, #faf8f5, transparent)",
        }}
      />
    </section>
  );
}
