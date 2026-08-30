"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useUiStore } from "@/stores/ui.store";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { StageMilestone } from "./StageMilestone";
import { StageMilestoneSkeleton } from "./StageMilestoneSkeleton";

const DEFAULT_KICKER = "مسار التعلّم";
const DEFAULT_TITLE = "خطواتك على طريق النجاح";
const DEFAULT_TITLE_EMPHASIS = "مرحلة بمرحلة";
const DEFAULT_SUBTITLE =
  "قسّمنا الرحلة إلى مراحل واضحة ومترابطة — من الروضة حتى الثانوية — بمناهج وأدوات صمّمها مختصّون لكل مرحلة، ليمرّ الطالب من خطوة لأخرى بثقة وسلاسة.";

const FOOTER_NOTE = "تعرّف على مرحلة طفلك الآن، وابدأ المسار من حيث يناسب سِنّه";

const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

/**
 * "Educational Stages" homepage section — an interactive "learning path" that
 * walks the visitor stage by stage (المسار). Each stage is a numbered
 * milestone pinned to a drawn connecting spine, with a rich student-facing card
 * (matted photo window, stamped rule, live per-stage metrics and an arrow CTA)
 * in its own brand accent — lifting real, animated course/teacher numbers so
 * the section feels alive rather than static.
 *
 *  · Desktop (≥1024px) — a connecting spine on the start edge draws downward as
 *    you scroll; numbered milestones align to the card midlines.
 *  · Tablet (≥640px)  — cards stay horizontal, badge tucks onto the card.
 *  · Mobile (<640px)  — single column, full-width, no horizontal overflow.
 *
 * Fully responsive, zero layout-shift skeletons, image optimization + priority
 * loading, and `prefers-reduced-motion` respected throughout.
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
  /** Number of milestones that eager-load their image too. */
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const { ref, inView } = useInViewOnce<HTMLElement>({ rootMargin: "0px 0px -12% 0px" });

  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;

  const stageIds = useMemo(() => stages.map((s) => Number(s.id)).filter((id) => Number.isFinite(id) && id > 0), [stages]);
  const { statsById } = useStageStatsState(stageIds, inView);

  if (stages.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  const ink = isDark ? "#F2EDE6" : "#211B14";
  const muted = isDark ? "#A79E92" : "#6E665C";

  return (
    <section
      ref={ref}
      dir="rtl"
      aria-labelledby="stages-path-title"
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
        <header className="relative text-start">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5"
          >
            <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-[var(--brand-secondary)]" />
            <span className="text-xs font-bold tracking-[0.18em]" style={{ color: isDark ? "#F2C879" : "var(--brand-primary)" }}>
              {kicker}
            </span>
          </motion.span>

          <motion.h2
            id="stages-path-title"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="mt-4 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
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
            className="mt-6 max-w-2xl border-s-2 ps-5 text-sm leading-loose sm:text-base lg:text-lg"
            style={{ color: muted, borderColor: "var(--brand-primary)" }}
          >
            {subtitle}
          </motion.p>
        </header>

        {/* ── the path ── */}
        <div className="relative mt-12 sm:mt-16">
          {showSkeleton ? (
            <div className="space-y-8 lg:ps-16">
              {Array.from({ length: 3 }).map((_, i) => (
                <StageMilestoneSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ol className="relative lg:ps-16">
              {/* connecting spine — draws downward as it scrolls into view (lg+) */}
              <motion.span
                aria-hidden="true"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={reduce ? undefined : { scaleY: 1 }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 start-[34px] top-0 hidden w-px origin-top lg:block"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--brand-secondary) 50%, transparent), color-mix(in srgb, var(--brand-primary) 50%, transparent))",
                }}
              />

              {stages.map((stage, i) => (
                <li
                  key={String(stage.id)}
                  className="relative pb-8 last:pb-0 sm:pb-10 lg:pb-12 lg:last:pb-0"
                >
                  <StageMilestone
                    stage={stage}
                    index={i}
                    total={stages.length}
                    priority={i < priorityCount}
                    stats={statsById.get(Number(stage.id)) ?? null}
                    active={inView}
                    label={arabicNumber(i + 1)}
                  />
                </li>
              ))}
            </ol>
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
