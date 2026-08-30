"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  suffix,
  className,
}: {
  value: number;
  active: boolean;
  suffix?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!active || reduce) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce, value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {arabicNumber(display)}
      {suffix ? <span className="ms-0.5 text-[0.72em]">{suffix}</span> : null}
    </span>
  );
}

export interface StageStatsLike {
  coursesCount: number;
  teachersCount: number;
}

interface StageMilestoneProps {
  stage: EducationalStage;
  /** 0-based position in the full list (drives the accent progression). */
  index: number;
  total: number;
  /** Eager-load the image for the first milestone. */
  priority?: boolean;
  /** Live per-stage stats (may be absent while loading / unavailable). */
  stats?: StageStatsLike | null;
  /** Whether the milestone is currently visible (triggers number count-up). */
  active: boolean;
  /** Milestone number in Arabic-Indic numerals. */
  label: string;
}

/**
 * One milestone on the "Educational path". A numbered, icon-sealed badge sits
 * on the connecting spine; the student-facing card shows a matted photo window,
 * a stamped rule under the display name, live per-stage metrics and an arrow
 * CTA — each in its own brand accent, revealed with a gentle rise on scroll.
 */
export function StageMilestone({
  stage,
  index,
  total,
  priority = false,
  stats,
  active,
  label,
}: StageMilestoneProps) {
  const reduce = useReducedMotion();
  const accent = stageAccentTokens(stage, index, total);
  const href = stage.href ?? `/stages/${stage.id}`;
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;

  const showCourses = Boolean(stats && stats.coursesCount > 0);
  const showTeachers = Boolean(stats && stats.teachersCount > 0);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative w-full"
    >
      <article
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft-md transition-all duration-300 ease-brand",
          "hoverable:hover:-translate-y-1 hoverable:hover:shadow-soft-lg",
          accent.className,
        )}
        style={accent.style}
      >
        {/* per-stage top accent hairline */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--stage-color)]" />

        <Link
          href={href}
          aria-label={`${stage.name} — استكشف المرحلة`}
          className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--stage-color)] sm:flex-row"
        >
          {/* photo window */}
          <div className="sm:[flex-basis:42%] sm:shrink-0">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted sm:h-full sm:aspect-auto">
              {hasImage ? (
                <Image
                  src={stage.image as string}
                  fill
                  sizes="(min-width: 640px) 42vw, 100vw"
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  placeholder="blur"
                  blurDataURL={BRAND_BLUR_DATA_URL}
                  alt={stage.name}
                  className="object-cover transition-transform duration-500 ease-brand hoverable:group-hover:scale-[1.04]"
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
                  <StageIcon
                    name={stage.icon ?? "auto"}
                    className="h-14 w-14 text-[var(--stage-fg)] opacity-80"
                  />
                </span>
              )}
            </div>
          </div>

          {/* body */}
          <div className="flex flex-1 flex-col justify-center gap-2.5 p-5 sm:p-7 lg:p-8">
            {stage.meta ? (
              <p className="text-xs font-bold text-[var(--stage-color)] sm:text-sm">{stage.meta}</p>
            ) : null}

            <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl lg:text-[1.7rem]">
              {stage.name}
            </h3>
            <span aria-hidden="true" className="h-px w-12 bg-[var(--stage-color)]" />

            {stage.description ? (
              <p className="line-clamp-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                {stage.description}
              </p>
            ) : null}

            {/* live metrics */}
            {(showCourses || showTeachers) && stats ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {showCourses ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold"
                    style={{
                      borderColor: "color-mix(in srgb, var(--stage-color) 30%, transparent)",
                      background: "color-mix(in srgb, var(--stage-color-soft) 22%, transparent)",
                      color: "var(--stage-color-deep)",
                    }}
                  >
                    <AnimatedNumber value={stats.coursesCount} active={active} suffix="منهج" />
                  </span>
                ) : null}
                {showTeachers ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold"
                    style={{
                      borderColor: "color-mix(in srgb, var(--stage-color) 30%, transparent)",
                      background: "color-mix(in srgb, var(--stage-color-soft) 22%, transparent)",
                      color: "var(--stage-color-deep)",
                    }}
                  >
                    <AnimatedNumber value={stats.teachersCount} active={active} suffix="معلم" />
                  </span>
                ) : null}
              </div>
            ) : null}

            <span
              role="presentation"
              className="mt-1 inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--stage-color)] transition-all duration-300 ease-brand hoverable:group-hover:gap-3"
            >
              <span className="underline decoration-foreground/30 underline-offset-4 transition-colors duration-300 hoverable:group-hover:decoration-[var(--stage-color)]">
                استكشف المرحلة
              </span>
              <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" aria-hidden="true" />
              <ArrowRight className="h-4 w-4 rtl:hidden ltr:block" aria-hidden="true" />
            </span>
          </div>
        </Link>
      </article>

      {/* milestone number — absolute so it straddles the spine on desktop */}
      <span
        aria-hidden="true"
        className={cn(
          "font-display pointer-events-none absolute flex h-11 w-11 items-center justify-center rounded-full text-base font-bold",
          "text-[var(--stage-fg)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--stage-color-soft)_55%,transparent)]",
          "top-5 -start-5 sm:-start-6 lg:-start-[52px] lg:top-1/2 lg:-translate-y-1/2",
        )}
        style={{ backgroundColor: "var(--stage-color)" }}
      >
        {label}
      </span>
    </motion.div>
  );
}
