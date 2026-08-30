"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useUiStore } from "@/stores/ui.store";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { StageCard } from "./StageCard";
import { StageCardSkeleton } from "./StageCardSkeleton";

const DEFAULT_KICKER = "مراحل التعلّم";
const DEFAULT_TITLE = "خطوتك على طريق النجاح";
const DEFAULT_TITLE_EMPHASIS = "مرحلة بمرحلة";
const DEFAULT_SUBTITLE =
  "قسمنا الرحلة إلى مراحل واضحة ومترابطة — من الروضة حتى الثانوية — بمناهج وأدوات صمّمها مختصّون لكل مرحلة، ليمرّ الطالب من خطوة لأخرى بثقة وسلاسة.";

const FOOTER_NOTE = "تعرّف على مرحلة طفلك الآن، وابدأ من حيث يناسب سِنّه";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/**
 * "Educational Stages" homepage section — a responsive mosaic of premium,
 * student-facing stage tiles. Each tile is its own brand-accented "world"
 * (chapter number badge, icon seal, matted photo, live course/teacher metrics)
 * so the grid reads as a warm terracotta → gold journey of distinct cards.
 *
 *  · Desktop (≥1280px) — 4-column mosaic.
 *  · Laptop (≥1024px)  — 3-column.
 *  · Tablet (≥640px)   — 2-column.
 *  · Mobile (<640px)   — single column, full-width.
 *
 * Scroll-triggered staggered entrance, zero-layout-shift skeletons, image
 * optimization + priority loading, and `prefers-reduced-motion` respected.
 */
export function EducationalStagesSection({
  stages: stagesProp,
  kicker = DEFAULT_KICKER,
  titleLead = DEFAULT_TITLE,
  titleEmphasis = DEFAULT_TITLE_EMPHASIS,
  subtitle = DEFAULT_SUBTITLE,
  priorityCount = 0,
}: {
  /** Optional explicit stage list (used in tests / preview). */
  stages?: EducationalStage[];
  kicker?: string;
  titleLead?: string;
  titleEmphasis?: string;
  subtitle?: string;
  /** Number of tiles that eager-load their image too. */
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const { ref, inView } = useInViewOnce<HTMLElement>({ rootMargin: "0px 0px -15% 0px" });

  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;

  const stageIds = useMemo(
    () => stages.map((s) => Number(s.id)).filter((id) => Number.isFinite(id) && id > 0),
    [stages],
  );
  const { statsById } = useStageStatsState(stageIds, inView);

  if (stages.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  const ink = isDark ? "#F2EDE6" : "#211B14";
  const muted = isDark ? "#A79E92" : "#6E665C";

  return (
    <section
      ref={ref}
      dir="rtl"
      aria-labelledby="stages-title"
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        background: isDark
          ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
          : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
      }}
    >
      {/* ruled-paper + dot texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? `repeating-linear-gradient(to bottom, rgba(255,255,255,0.022) 0, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(255,255,255,0.035) 0.6px, transparent 0.6px)`
            : `repeating-linear-gradient(to bottom, rgba(120,80,40,0.03) 0, rgba(120,80,40,0.03) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(120,80,40,0.05) 0.6px, transparent 0.6px)`,
          backgroundSize: "100% 100%, 26px 26px",
        }}
      />

      {/* decorative brand depth layer */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute -top-24 end-0 h-80 w-80 rounded-full bg-[var(--brand-primary)] opacity-[0.1] blur-3xl" />
        <div className="absolute -bottom-24 start-0 h-96 w-96 rounded-full bg-[var(--brand-secondary)] opacity-[0.09] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── editorial header ── */}
        <header className="relative max-w-2xl text-start">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5"
          >
            <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-[var(--brand-secondary)]" />
            <span
              className="text-xs font-bold tracking-[0.18em]"
              style={{ color: isDark ? "#F2C879" : "var(--brand-primary)" }}
            >
              {kicker}
            </span>
          </motion.span>

          <motion.h2
            id="stages-title"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: ink }}
          >
            {titleLead}{" "}
            <span className="bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-primary-400)] to-[var(--brand-secondary)] bg-clip-text text-transparent">
              {titleEmphasis}
            </span>
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mt-6 border-s-2 ps-5 text-sm leading-loose sm:text-base lg:text-lg"
            style={{ color: muted, borderColor: "var(--brand-primary)" }}
          >
            {subtitle}
          </motion.p>
        </header>

        {/* ── the mosaic ── */}
        <div className="mt-12 sm:mt-16">
          {showSkeleton ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StageCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial={reduce ? false : "hidden"}
              whileInView={reduce ? undefined : "show"}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4"
            >
              {stages.map((stage, i) => (
                <StageCard
                  key={String(stage.id)}
                  stage={stage}
                  index={i}
                  total={stages.length}
                  priority={i < priorityCount}
                  stats={statsById.get(Number(stage.id)) ?? null}
                  active={inView}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ── closing note ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex items-center justify-center gap-3 sm:mt-16"
        >
          <span className="h-px w-8 bg-[var(--brand-secondary)]" aria-hidden="true" />
          <span className="text-xs font-extrabold tracking-[0.22em] sm:text-sm" style={{ color: muted }}>
            {FOOTER_NOTE}
          </span>
          <span className="h-px w-8 bg-[var(--brand-primary)]" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
