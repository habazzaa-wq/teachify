"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, Users, Award, Tag, Sparkles } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { formatNumber, initialsOf } from "@/lib/format";
import type { CatalogCourse } from "../types";
import { ACCENT, DIFFICULTY_COLORS, DIFFICULTY_LABELS, PRIMARY } from "../constants";

interface CatalogCourseCardProps {
  course: CatalogCourse;
  index: number;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) {
    return null;
  }

  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${formatNumber(Math.round(hours * 10) / 10)} ساعة`;
  }

  return `${formatNumber(minutes)} دقيقة`;
}

export function CatalogCourseCard({ course, index }: CatalogCourseCardProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const diffColor = DIFFICULTY_COLORS[course.difficulty] ?? DIFFICULTY_COLORS.beginner!;
  const dur = formatDuration(course.duration);
  const hasDiscount = course.discountPrice !== null && course.discountPrice > 0;
  const isFree = course.pricingType === "free";
  const currency = course.currency ?? "ر.س";

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
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video w-full overflow-hidden">
        {course.thumbnail || course.coverImage ? (
          <Image
            src={course.thumbnail || course.coverImage!}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.125), rgb(var(--brand-secondary-rgb) / 0.051))`
                : `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.071), rgb(var(--brand-secondary-rgb) / 0.031))`,
            }}
          >
            <BookOpen className="h-12 w-12" style={{ color: `rgb(var(--brand-primary-rgb) / 0.251)` }} />
          </div>
        )}

        {/* featured ribbon */}
        {course.featured && (
          <span
            className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-secondary-dark))",
              boxShadow: "0 4px 16px rgba(245,158,11,0.4)",
            }}
          >
            <Sparkles className="h-3 w-3" />
            مميز
          </span>
        )}

        {/* subject badge */}
        {course.subject && (
          <span
            className="absolute start-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.8))`,
              boxShadow: `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`,
            }}
          >
            <Tag className="h-3 w-3" />
            {course.subject.name}
          </span>
        )}

        {/* stage badge */}
        {course.educationalStage && (
          <span
            className="absolute bottom-3 start-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold shadow-lg backdrop-blur-md"
            style={{
              background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.85)",
              color: isDark ? "#F0ECE6" : "#1a1510",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            {course.educationalStage.name}
          </span>
        )}

        {/* dark overlay for text legibility on hover */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.15), transparent 45%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-1 flex-col gap-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        {/* difficulty + duration */}
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
            {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
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

        {/* title */}
        <h3
          className="line-clamp-2 text-base font-bold leading-snug transition-colors duration-300 group-hover:text-[var(--catalog-course-hover)] sm:text-lg"
          style={{
            color: isDark ? "#F0ECE6" : "#1a1510",
            ["--catalog-course-hover" as string]: PRIMARY,
          }}
        >
          {course.title}
        </h3>

        {/* short description */}
        {course.shortDescription && (
          <p
            className="line-clamp-2 text-xs leading-relaxed sm:text-sm"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            {course.shortDescription}
          </p>
        )}

        <div className="flex-1" />

        {/* instructor */}
        {course.instructor?.name && (
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
                style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))` }}
              >
                {initialsOf(course.instructor.name)}
              </div>
            )}
            <span className="text-xs font-medium" style={{ color: isDark ? "#a09898" : "#6B7280" }}>
              {course.instructor.name}
            </span>
          </div>
        )}

        {/* stats bar */}
        <div
          className="flex items-center gap-4 border-t pt-3"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
        >
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}
          >
            <Users className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
            {formatNumber(course.studentsCount)} طالب
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}
          >
            <BookOpen className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            {formatNumber(course.lessonsCount)} درس
          </div>
          {course.certificateEnabled && (
            <div
              className="me-auto flex items-center gap-1 text-[11px] font-bold"
              style={{ color: ACCENT }}
            >
              <Award className="h-3.5 w-3.5" />
              شهادة
            </div>
          )}
        </div>

        {/* price */}
        <div className="flex items-center justify-between">
          {isFree ? (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
              }}
            >
              مجاني
            </span>
          ) : hasDiscount ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.8))`,
                  boxShadow: `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`,
                }}
              >
                {formatNumber(course.discountPrice!)} {currency}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white/70 line-through"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)" }}
              >
                {formatNumber(course.price ?? 0)} {currency}
              </span>
            </div>
          ) : course.price ? (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.8))`,
                boxShadow: `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`,
              }}
            >
              {formatNumber(course.price)} {currency}
            </span>
          ) : (
            <span className="text-xs font-medium" style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}>
              —
            </span>
          )}

          {isFree ? (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold shadow-lg transition-all duration-300 group-hover:-translate-x-1"
              style={{
                background: `linear-gradient(135deg, var(--brand-secondary), var(--brand-secondary-dark))`,
                color: "#1a1510",
                boxShadow: `0 4px 16px rgb(var(--brand-secondary-rgb) / 0.333)`,
              }}
            >
              اشترك الآن مجاناً
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold shadow-lg transition-all duration-300 group-hover:-translate-x-1"
              style={{
                background: "#F7A20B",
                color: "#1a1510",
                boxShadow: "0 4px 16px rgba(247,162,11,0.4)",
              }}
            >
              اشترك الآن
            </span>
          )}
        </div>
      </div>

      {/* bottom accent bar */}
      <div
        className="h-[3px] w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))` }}
      />
    </div>
  );

  const anim = {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-40px" as const },
    transition: {
      duration: 0.55,
      delay: (index % 12) * 0.06,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };

  return (
    <motion.div {...anim} style={{ perspective: "800px" }}>
      <Link
        href={`/courses/${course.slug}`}
        className={cn("block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl")}
      >
        {card}
      </Link>
    </motion.div>
  );
}
