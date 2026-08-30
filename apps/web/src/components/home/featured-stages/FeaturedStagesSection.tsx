"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { pickFeaturedStages } from "../stages/featured";
import { StageCard } from "./StageCard";
import { StageCardSkeleton } from "./StageCardSkeleton";

const DEFAULT_EYEBROW = "مراحلنا الدراسية";
const DEFAULT_TITLE_LEAD = "صُمّمت كل مرحلة لتُبنيَ على سابقتها — من";
const DEFAULT_TITLE_EMPHASIS = "البداية حتى التميّز";
const DEFAULT_SUBTITLE =
  "قسمنا رحلة التعلّم إلى مراحل واضحة ومترابطة تضمن انتقالاً سلساً بين الأعمار والمهارات، مع مناهج وأدوات صمّمها مختصّون لكل مرحلة.";

/**
 * Editorial "Featured Stages" homepage section.
 *
 * Responsive strategy:
 *  · Mobile (<640px)      — single column; featured card stacks (image above
 *    text, fixed 16/10 aspect), regular cards use a fixed 4/3 image. No
 *    side-by-side, no horizontal scroll: everything is full-width.
 *  · Tablet (≥640px)      — 2-column grid; the featured hero joins its image
 *    and text side by side in an equal-height split (image becomes
 *    `aspect-auto` + grid-stretch, so no fixed heights are ever used).
 *  · Desktop (≥1024px)    — 3 columns; ≥1280px → 4 columns. The hero stays a
 *    full-width editorial lead above a clean wrapping grid.
 *
 * The grid is plain auto-placement: it wraps gracefully for ANY stage count
 * (1 stage → hero only; odd counts → balanced rows). Edge cases:
 *  · Missing image → branded dot-mesh placeholder (never a broken image).
 *  · Long text     → `line-clamp` + `flex-1`/`mt-auto` keeps rows equal-height.
 *  · No `featured` flag in data → first stage is heroed by default; pass
 *    `pickFeaturedStages(..., { heroByDefault: false })` for a plain grid.
 *
 * Decor is `hidden lg:block` and the section is `overflow-hidden`, so nothing
 * decorative can ever cause horizontal overflow on small screens.
 */
export function FeaturedStagesSection({
  stages: stagesProp,
  eyebrow = DEFAULT_EYEBROW,
  titleLead = DEFAULT_TITLE_LEAD,
  titleEmphasis = DEFAULT_TITLE_EMPHASIS,
  subtitle = DEFAULT_SUBTITLE,
  priorityCount = 0,
}: {
  stages?: EducationalStage[];
  eyebrow?: string;
  titleLead?: string;
  titleEmphasis?: string;
  subtitle?: string;
  /** Number of regular cards (after the hero) that eager-load their images. */
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();

  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;

  const { featured, rest } = useMemo(() => pickFeaturedStages(stages), [stages]);

  if (stages.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };
  const gridVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const revealProps = {
    initial: reduce ? false : "hidden",
    whileInView: "show",
    viewport: { once: true, margin: "0px 0px -12% 0px" },
  } as const;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="featured-stages-title"
      className="relative w-full overflow-hidden bg-muted/40 py-20 sm:py-24"
    >
      {/* decorative depth layer — desktop only, never affects mobile layout */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute -top-24 end-0 h-80 w-80 rounded-full bg-[var(--brand-primary)] opacity-[0.12] blur-3xl" />
        <div className="absolute -bottom-24 start-0 h-96 w-96 rounded-full bg-[var(--brand-secondary)] opacity-[0.1] blur-3xl" />
        <div className="absolute inset-0 bg-dot opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header — start-aligned for the editorial, non-centered feel */}
        <header className="relative text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-secondary)_45%,transparent)] bg-[color-mix(in_srgb,var(--brand-secondary)_15%,transparent)] px-3.5 py-1.5 text-xs font-bold text-[color-mix(in_srgb,var(--brand-secondary-700)_90%,black)] dark:text-[color-mix(in_srgb,var(--brand-secondary-200)_92%,white)]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary-500)]" />
            {eyebrow}
          </span>

          <h2
            id="featured-stages-title"
            className="mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {titleLead}{" "}
            <span className="bg-gradient-to-r from-[var(--brand-primary-500)] via-[var(--brand-primary-400)] to-[var(--brand-secondary-500)] bg-clip-text text-transparent">
              {titleEmphasis}
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </header>

        {showSkeleton ? (
          /* skeleton mirrors the final geometry (zero layout shift on swap) */
          <div className="mt-10 space-y-6 sm:mt-14 sm:space-y-8">
            <StageCardSkeleton variant="featured" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StageCardSkeleton key={i} variant="regular" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {featured ? (
              <motion.div
                {...revealProps}
                variants={gridVariants}
                className="mt-10 sm:mt-14"
              >
                <motion.div variants={cardVariants} className="h-full">
                  <StageCard
                    stage={featured}
                    variant="featured"
                    order={stages.indexOf(featured)}
                    total={stages.length}
                    priority
                  />
                </motion.div>
              </motion.div>
            ) : null}

            {rest.length > 0 ? (
              <motion.div
                {...revealProps}
                variants={gridVariants}
                className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4"
              >
                {rest.map((stage, i) => (
                  <motion.div key={String(stage.id)} variants={cardVariants} className="h-full">
                    <StageCard
                      stage={stage}
                      order={stages.indexOf(stage)}
                      total={stages.length}
                      priority={i < priorityCount}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}