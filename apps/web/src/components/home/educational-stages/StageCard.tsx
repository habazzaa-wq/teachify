"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { stageAccentTokens } from "../stages/accent";
import type { EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";

/** Brand-tinted blur placeholder (no broken-image flash). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

/** Arabic-Indic numerals, e.g. 1 → "١". */
const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

/**
 * A number that counts up from `0` to `value` once `active` becomes true.
 * Respects `prefers-reduced-motion` (jumps straight to the final value).
 */
function AnimatedNumber({
  value,
  active,
  className,
}: {
  value: number;
  active: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!active || reduce) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce, value]);

  return <span className={cn("tabular-nums", className)}>{arabicNumber(display)}</span>;
}

export interface StageStatsLike {
  coursesCount: number;
  teachersCount: number;
}

interface StageCardProps {
  stage: EducationalStage;
  /** 0-based position in the full list (drives the accent progression). */
  index: number;
  total: number;
  /** Eager-load the image for the first card(s). */
  priority?: boolean;
  /** Live per-stage stats (may be absent while loading / unavailable). */
  stats?: StageStatsLike | null;
  /** Whether the section is visible (triggers number count-up). */
  active: boolean;
}

/**
 * One educational stage as a premium vertical tile in the stages grid.
 *
 * Each tile opens with a matted photo window carrying a filled chapter-number
 * badge and an icon seal; the body holds the meta pill, display-face name,
 * stamped rule, a two-line description and live per-stage metrics; a filled
 * accent CTA rounds off the tile. Every stage wears its own brand accent, and
 * the tile lifts with an accent glow on hover — so the grid reads as a warm
 * terracotta → gold journey of distinct, student-facing cards.
 */
export function StageCard({
  stage,
  index,
  total,
  priority = false,
  stats,
  active,
}: StageCardProps) {
  const reduce = useReducedMotion();
  const accent = stageAccentTokens(stage, index, total);
  const href = stage.href ?? `/stages/${stage.id}`;
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;

  const showCourses = Boolean(stats && stats.coursesCount > 0);
  const showTeachers = Boolean(stats && stats.teachersCount > 0);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft-md transition-all duration-300 ease-brand",
        "hoverable:hover:-translate-y-1.5 hoverable:hover:shadow-[0_18px_44px_-18px_color-mix(in_srgb,var(--stage-color)_55%,transparent)]",
        accent.className,
      )}
      style={accent.style}
    >
      {/* top accent hairline */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1 bg-[var(--stage-color)]" />

      {/* ── media ── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={stage.image as string}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            alt={stage.name}
            className="object-cover transition-transform duration-700 ease-brand hoverable:group-hover:scale-[1.07]"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in srgb, var(--stage-color-soft) 92%, transparent), color-mix(in srgb, var(--stage-color-deep) 78%, transparent))",
            }}
          >
            <StageIcon name={stage.icon ?? "auto"} className="h-16 w-16 text-[var(--stage-fg)] opacity-80" />
          </span>
        )}

        {/* soft gradient so badges sit on a calm base */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
        />

        {/* chapter number badge — top start */}
        <span
          aria-hidden="true"
          className="absolute start-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-[var(--stage-fg)] shadow-soft-md"
          style={{ backgroundColor: "var(--stage-color)" }}
        >
          {arabicNumber(index + 1)}
        </span>

        {/* icon seal — top end */}
        <span
          aria-hidden="true"
          className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-[var(--stage-fg)] shadow-soft-md backdrop-blur-sm transition-transform duration-300 ease-brand hoverable:group-hover:scale-105"
          style={{ backgroundColor: "color-mix(in srgb, var(--stage-color-deep) 72%, transparent)" }}
        >
          <StageIcon name={stage.icon ?? "auto"} className="h-6 w-6" />
        </span>
      </div>

      {/* ── body ── */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {stage.meta ? (
          <p className="text-xs font-extrabold tracking-wide" style={{ color: "var(--stage-color)" }}>
            {stage.meta}
          </p>
        ) : null}

        <h3 className="mt-1.5 text-xl font-bold leading-snug tracking-tight text-foreground sm:text-[1.35rem]">
          {stage.name}
        </h3>
        <span aria-hidden="true" className="mt-2 h-px w-12 bg-[var(--stage-color)]" />

        {stage.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {stage.description}
          </p>
        ) : null}

        {/* live metrics */}
        {(showCourses || showTeachers) && stats ? (
          <div className="mt-auto flex items-center gap-4 pt-5">
            {showCourses ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                <BookOpen
                  className="h-4 w-4 text-[var(--stage-color)]"
                  aria-hidden="true"
                />
                <AnimatedNumber value={stats.coursesCount} active={active} className="text-foreground" />
                <span className="text-xs font-bold text-muted-foreground">منهج</span>
              </span>
            ) : null}
            {showTeachers ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                <Users className="h-4 w-4 text-[var(--stage-color)]" aria-hidden="true" />
                <AnimatedNumber value={stats.teachersCount} active={active} className="text-foreground" />
                <span className="text-xs font-bold text-muted-foreground">معلم</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── CTA ── */}
      <Link
        href={href}
        aria-label={`${stage.name} — استكشف المرحلة`}
        className="group/cta relative flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--stage-color)] sm:px-6"
      >
        <span
          className="text-sm font-extrabold transition-colors duration-300"
          style={{ color: "var(--stage-color)" }}
        >
          استكشف المرحلة
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--stage-fg)] transition-transform duration-300 ease-brand hoverable:group-hover/cta:scale-110 hoverable:group-hover/cta:-translate-x-0.5"
          style={{ backgroundColor: "var(--stage-color)" }}
        >
          <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" />
          <ArrowRight className="h-4 w-4 rtl:hidden ltr:block" />
        </span>
      </Link>
    </motion.article>
  );
}
