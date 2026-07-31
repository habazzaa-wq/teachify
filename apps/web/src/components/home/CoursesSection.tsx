"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LazyMotion, m, domAnimation, useInView, useReducedMotion } from "framer-motion";
import {
  Users,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ArrowLeft,
  Play,
  Tag,
  Star,
  Sparkles,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicHomepageCourses } from "@/features/homepage/courses/hooks";
import type { HomepageCourse } from "@/features/homepage/courses/types";

const primary = "#D87B63";
const secondary = "#FFB50E";

const INITIAL_VISIBLE = 6;

const difficultyLabel: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

const difficultyColor: Record<string, string> = {
  beginner: "#22C55E",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
  all_levels: primary,
};

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ""}`;
  if (m > 0) return `${m} دقيقة`;
  return null;
}

function formatPrice(price: number | null, discount: number | null, currency: string | null): { original: string | null; discounted: string | null; isFree: boolean } {
  const curr = currency ?? "ج.م";
  if (price === null || price === 0) {
    return { original: null, discounted: null, isFree: true };
  }
  if (discount && discount < price) {
    return {
      original: `${price} ${curr}`,
      discounted: `${discount} ${curr}`,
      isFree: false,
    };
  }
  return { original: null, discounted: `${price} ${curr}`, isFree: false };
}

/* ────────────── Course Card ────────────── */
function CourseCard({
  course,
  index,
  isDark,
  reduced,
}: {
  course: HomepageCourse;
  index: number;
  isDark: boolean;
  reduced: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const pricing = formatPrice(course.price, course.discountPrice, course.currency);
  const dur = formatDuration(course.duration);
  const diffColor = difficultyColor[course.difficulty] ?? primary;
  const hasImage = !!(course.thumbnail || course.coverImage) && !imgFailed;

  const motionProps = reduced
    ? { opacity: 0 }
    : { opacity: 0, y: 40, scale: 0.95 };

  const card = (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-500"
      style={{
        background: isDark ? "#16141e" : "#fff",
        boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(120,90,60,0.06)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      }}
    >
      {/* ── Thumbnail area ── */}
      <div className="relative h-48 w-full overflow-hidden sm:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hasImage && (
          <img
            src={course.thumbnail || course.coverImage || ""}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={() => setImgFailed(true)}
          />
        )}

        {/* Fallback gradient when no image */}
        {!hasImage && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, ${primary}18, ${secondary}08)`
                : `linear-gradient(135deg, ${primary}12, ${secondary}06)`,
            }}
          >
            <BookOpen className="h-14 w-14" style={{ color: `${primary}40` }} />
          </div>
        )}

        {/* Dark overlay on hover */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        {/* Play button overlay on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:pointer-events-auto group-hover:opacity-100">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
              boxShadow: `0 8px 32px ${primary}50`,
            }}
          >
            <Play className="h-6 w-6 text-white fill-white" style={{ marginRight: -2 }} />
          </div>
        </div>

        {/* Featured badge */}
        {course.featured && (
          <div
            className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${secondary}, ${secondary}cc)`,
              boxShadow: `0 4px 16px ${secondary}40`,
            }}
          >
            <Star className="h-3 w-3 fill-white" />
            مميزة
          </div>
        )}

        {/* Category badge */}
        {course.category && (
          <div
            className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md"
            style={{
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.85)",
              color: isDark ? "rgba(255,255,255,0.8)" : "#374151",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <Tag className="h-3 w-3" />
            {course.category.name}
          </div>
        )}

        {/* Price badge */}
        <div
          className="absolute bottom-3 start-3"
        >
          {pricing.isFree ? (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
              }}
            >
              مجاني
            </span>
          ) : pricing.original ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                  boxShadow: `0 4px 16px ${primary}40`,
                }}
              >
                {pricing.discounted}
              </span>
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/70 line-through backdrop-blur-sm">
                {pricing.original}
              </span>
            </div>
          ) : (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                boxShadow: `0 4px 16px ${primary}40`,
              }}
            >
              {pricing.discounted}
            </span>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="relative flex flex-1 flex-col gap-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        {/* Difficulty + Duration */}
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: isDark ? `${diffColor}18` : `${diffColor}12`,
              color: diffColor,
              border: `1px solid ${isDark ? `${diffColor}25` : `${diffColor}15`}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: diffColor }} />
            {difficultyLabel[course.difficulty] ?? course.difficulty}
          </span>
          {dur && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}
            >
              <Clock className="h-3 w-3" />
              {dur}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="line-clamp-2 text-base font-bold leading-snug transition-colors duration-300 group-hover:text-[var(--course-hover)] sm:text-lg"
          style={{
            color: isDark ? "#F0ECE6" : "#1a1510",
            ["--course-hover" as string]: primary,
          }}
        >
          {course.title}
        </h3>

        {/* Short description */}
        {course.shortDescription && (
          <p
            className="line-clamp-2 text-xs leading-relaxed sm:text-sm"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            {course.shortDescription}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-2.5">
            {course.instructor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="h-7 w-7 rounded-full object-cover ring-2"
                style={{ "--tw-ring-color": isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" } as React.CSSProperties}
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                {course.instructor.name?.charAt(0)}
              </div>
            )}
            <span
              className="text-xs font-medium"
              style={{ color: isDark ? "#a09898" : "#6B7280" }}
            >
              {course.instructor.name}
            </span>
          </div>
        )}

        {/* Stats bar */}
        <div
          className="flex items-center gap-4 border-t pt-3"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}
          >
            <Users className="h-3.5 w-3.5" style={{ color: primary }} />
            {course.studentsCount} طالب
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}
          >
            <BookOpen className="h-3.5 w-3.5" style={{ color: secondary }} />
            {course.lessonsCount} درس
          </div>
          {course.certificateEnabled && (
            <div
              className="me-auto flex items-center gap-1 text-[11px] font-bold"
              style={{ color: secondary }}
            >
              <Award className="h-3.5 w-3.5" />
              شهادة
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom accent bar ── */}
      <div
        className="h-[3px] w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
      />
    </div>
  );

  const anim = {
    initial: motionProps,
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-40px" as const },
    transition: {
      duration: 0.55,
      delay: (index % INITIAL_VISIBLE) * 0.08,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };

  return (
    <m.div
      {...anim}
      style={{ perspective: "800px" }}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
      >
        {card}
      </Link>
    </m.div>
  );
}

/* ────────────── Section ────────────── */
export function CoursesSection() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);

  const { data: courses, isLoading } = usePublicHomepageCourses();
  const all = courses ?? [];

  if (all.length === 0 && !isLoading) return null;

  const hasMore = all.length > INITIAL_VISIBLE;
  const visible = expanded ? all : all.slice(0, INITIAL_VISIBLE);

  return (
    <LazyMotion features={domAnimation}>
    <section
      ref={ref}
      dir="rtl"
      className="relative w-full overflow-hidden py-10 sm:py-14 lg:py-20"
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0c0a12 0%, #110f1a 50%, #0c0a12 100%)"
            : "linear-gradient(170deg, #faf8f5 0%, #f5efe6 50%, #faf8f5 100%)",
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient orbs */}
      <div
        className="pointer-events-none absolute -start-40 top-1/4 h-[500px] w-[500px] rounded-full blur-[140px]"
        style={{ background: `${primary}06` }}
      />
      <div
        className="pointer-events-none absolute -end-40 bottom-1/4 h-[450px] w-[450px] rounded-full blur-[120px]"
        style={{ background: `${secondary}05` }}
      />

      {/* Floating decorative dots */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {[
            { x: "5%", y: "12%", s: 6, c: primary, d: 0 },
            { x: "92%", y: "18%", s: 5, c: secondary, d: 1.2 },
            { x: "8%", y: "82%", s: 5, c: secondary, d: 0.6 },
            { x: "88%", y: "75%", s: 7, c: primary, d: 1.8 },
            { x: "50%", y: "5%", s: 4, c: primary, d: 2.4 },
            { x: "45%", y: "95%", s: 5, c: secondary, d: 0.3 },
          ].map((d, i) => (
            <m.span
              key={i}
              className="absolute rounded-full"
              style={{ left: d.x, top: d.y, width: d.s, height: d.s, background: d.c, opacity: 0.15 }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 5 + (i % 3) * 2, repeat: Infinity, delay: d.d }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-8 text-center sm:mb-12">
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold sm:text-sm"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${primary}12, ${secondary}08)`
                  : `linear-gradient(135deg, ${primary}08, ${secondary}05)`,
                color: primary,
                border: `1px solid ${isDark ? `${primary}15` : `${primary}10`}`,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              الكورسات المتاحة
            </span>
          </m.div>

          <m.h2
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
            style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
          >
            استكشف{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              كورساتنا
            </span>
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            مجموعة متنوعة من الكورسات الاحترافية المصممة لتطوير مهاراتك وبناء مستقبلك
          </m.p>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-3xl"
                style={{
                  background: isDark ? "#16141e" : "#fff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                }}
              >
                <div className="h-48 w-full" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-20 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                  <div className="h-5 w-3/4 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                  <div className="h-3 w-full rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                  <div className="h-3 w-2/3 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Course grid ── */}
        {!isLoading && (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
            {visible.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                isDark={isDark}
                reduced={reduced}
              />
            ))}
          </div>
        )}

        {/* ── Show more / less ── */}
        {hasMore && !isLoading && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="mt-10 flex justify-center sm:mt-14"
          >
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-300 hover:shadow-xl"
              style={{
                color: isDark ? "#F0ECE6" : "#fff",
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                boxShadow: `0 4px 20px ${primary}28`,
              }}
            >
              {expanded ? (
                "عرض أقل"
              ) : (
                <>
                  عرض المزيد
                  <span
                    className="inline-flex h-6 min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    {all.length - INITIAL_VISIBLE}
                  </span>
                </>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  expanded ? "rotate-180" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>
          </m.div>
        )}
      </div>

      {/* ── Bottom fade ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0c0a12, transparent)"
            : "linear-gradient(to top, #faf8f5, transparent)",
        }}
      />
    </section>
    </LazyMotion>
  );
}
