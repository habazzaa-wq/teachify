"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/ui.store";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { StageWorld } from "./StageWorld";
import { StageWorldSkeleton } from "./StageWorldSkeleton";
import type { StageVariant } from "./types";

/*
 * Typography: this section only ever uses the site's dynamic font.
 * `font-sans` maps to `--font-sans` in tailwind.config (theme.extend.fontFamily.sans
 * → "var(--font-sans)"), which the root layout injects per-tenant via
 * next/font + buildFontStack(). We never reference a concrete typeface; the
 * hierarchy (size/weight/tracking/leading) is built on this single token so it
 * inherits whatever font the platform sets globally.
 */

const DEFAULT_TITLE_LEAD = "المراحل";
const DEFAULT_TITLE_EMPHASIS = "الدراسية";

const FOOTER_NOTE = "ابدأ الرحلة من حيث يناسب سِنّه";

const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

/**
 * Deterministic bento span for a stage, so the mosaic stays intentional and
 * hole-free for ANY number of stages:
 *  · stage 0 = hero (spans 2 columns on sm+; the "lead" of the composition),
 *  · followers alternate standard ↔ wide on the widest breakpoint for rhythm.
 *  · `grid-auto-flow-dense` back-fills any gap, so odd totals pack cleanly.
 */
function spanClass(index: number, variant: StageVariant): string {
  if (variant === "hero") return "col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2";
  if (variant === "wide") return "xl:col-span-2";
  return "";
}

function variantFor(index: number): StageVariant {
  if (index === 0) return "hero";
  if (index % 4 === 3) return "wide";
  return "standard";
}

/**
 * "Educational Stages" homepage section — a dimensional bento "world map".
 *
 * Creative concept: each stage is its own glassy, brand-accented world arranged
 * in an asymmetric mosaic (hero lead + varied-width satellites). The image is a
 * design material — an arch aperture with an accent reveal layer that slides up
 * behind it, a ghost Arabic numeral, an icon seal — and every card tilts in 3D,
 * with the photo parallaxing one layer deeper than the card (desktop). On touch
 * the same depth is revealed by tapping. Live course/teacher counts count up.
 * A contents-style stage index in the header gives it a confident, crafted
 * editorial voice that reads as trustworthy to a parent.
 *
 * Architecture (Server/Client boundary):
 *  · Static stage data is already fetched **server-side** in `(home)/page.tsx`
 *    (stagesServerService.getPublicStages) and hydrated into React Query. This
 *    section (a Client Component) reads that cache — no client round-trip — and
 *    adds a Client boundary only where interactivity requires it (Framer Motion,
 *    pointer/touch state, count-up). `LazyMount` in the page defers hydration
 *    until the section nears the viewport.
 *
 * Responsiveness: the composition is re-architected per breakpoint, not merely
 * scaled — hero collapses from a wide lead (xl/lg/sm) to the top full-width card
 * on mobile; the index hides below lg; sizes/margins tighten on small screens.
 */
export function EducationalStagesSection({
  stages: stagesProp,
  titleLead = DEFAULT_TITLE_LEAD,
  titleEmphasis = DEFAULT_TITLE_EMPHASIS,
  priorityCount = 0,
}: {
  stages?: EducationalStage[];
  titleLead?: string;
  titleEmphasis?: string;
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const ref = useRef<HTMLElement | null>(null);
  const { ref: inViewRef, inView } = useInViewOnce<HTMLElement>({
    rootMargin: "0px 0px -15% 0px",
  });

  // Scroll-linked parallax for the section's ambient depth (light mode only
  // animation tunnel). Reduced-motion users get a static, calm background.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

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
      ref={(node) => {
        ref.current = node;
        inViewRef.current = node;
      }}
      dir="rtl"
      aria-labelledby="stages-title"
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        background: isDark
          ? "linear-gradient(170deg, #0e0c14 0%, #17121c 55%, #0e0c14 100%)"
          : "linear-gradient(170deg, #fdfbf7 0%, #f6efe3 55%, #fdfbf7 100%)",
      }}
    >
      {/* ruled-paper + fine dot texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? `repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(255,255,255,0.04) 0.6px, transparent 0.6px)`
            : `repeating-linear-gradient(to bottom, rgba(120,80,40,0.03) 0, rgba(120,80,40,0.03) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(120,80,40,0.05) 0.6px, transparent 0.6px)`,
          backgroundSize: "100% 100%, 26px 26px",
        }}
      />

      {/* ambient brand glows — parallax against scroll (gated by reduced-motion) */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={reduce ? undefined : { y: glowY }}
      >
        <div className="absolute -top-24 end-[4%] h-[26rem] w-[26rem] rounded-full bg-[var(--brand-primary)] opacity-[0.14] blur-3xl" />
        <div className="absolute -bottom-28 start-[2%] h-[30rem] w-[30rem] rounded-full bg-[var(--brand-secondary)] opacity-[0.12] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] opacity-[0.05] blur-3xl" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─────────────────────────  header  ───────────────────────── */}
        <header className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
          <div className="max-w-2xl text-start">
            <motion.h2
              id="stages-title"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span style={{ color: "var(--brand-primary)" }}>{titleLead}</span>{" "}
              <span style={{ color: "var(--brand-secondary)" }}>{titleEmphasis}</span>
            </motion.h2>
          </div>

          {/* editorial "contents" index — mobile-hidden, lends crafted structure */}
          {!showSkeleton && stages.length > 0 ? (
            <motion.nav
              aria-label="فهرس المراحل"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
              className="hidden w-full max-w-sm border-s-2 ps-5 lg:block"
              style={{ borderColor: "color-mix(in srgb, var(--brand-secondary) 40%, transparent)" }}
            >
              <p
                className="font-sans mb-4 text-[11px] font-extrabold uppercase tracking-[0.24em]"
                style={{ color: muted }}
              >
                فهرس المراحل
              </p>
              <ol className="space-y-1">
                {stages.slice(0, 5).map((s, i) => (
                  <li key={String(s.id)}>
                    <Link
                      href={s.href ?? `/stages/${s.id}`}
                      className="font-sans group flex items-baseline gap-3 py-1.5 text-sm transition-colors outline-none focus-visible:text-[var(--brand-primary)]"
                      style={{ color: i === 0 ? ink : muted }}
                    >
                      <span
                        className="font-sans text-xs font-extrabold tabular-nums"
                        style={{ color: i === 0 ? "var(--brand-primary)" : "var(--brand-secondary)" }}
                      >
                        {arabicNumber(i + 1)}
                      </span>
                      <span className="truncate font-semibold transition-transform duration-300 ease-brand group-hover:translate-x-1">
                        {s.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="ms-auto h-px w-6 flex-shrink-0 transition-all duration-300 group-hover:w-10"
                        style={{ background: "color-mix(in srgb, var(--brand-secondary) 55%, transparent)" }}
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </motion.nav>
          ) : null}
        </header>

        {/* ─────────────────────────  bento mosaic  ───────────────────────── */}
        <div className="mt-12 sm:mt-16">
          {showSkeleton ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              <div className="w-[82vw] max-w-[340px] shrink-0 snap-start sm:col-span-2 sm:w-auto sm:max-w-none sm:shrink xl:col-span-2">
                <StageWorldSkeleton variant="hero" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink",
                    i === 2 ? "xl:col-span-2" : "",
                  )}
                >
                  <StageWorldSkeleton variant="standard" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial={reduce ? false : "hidden"}
              whileInView={reduce ? undefined : "show"}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              className="[-ms-overflow-style:none] -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-flow-dense sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 sm:items-stretch [&::-webkit-scrollbar]:hidden lg:grid-cols-3 lg:gap-7 xl:grid-cols-4"
            >
              {stages.map((stage, i) => {
                const variant = variantFor(i);
                return (
                  <StageWorld
                    key={String(stage.id)}
                    stage={stage}
                    index={i}
                    total={stages.length}
                    variant={variant}
                    priority={i < priorityCount}
                    stats={statsById.get(Number(stage.id)) ?? null}
                    active={inView}
                    className={cn(
                      "w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink",
                      spanClass(i, variant),
                    )}
                  />
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ─────────────────────────  closing note  ───────────────────────── */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:mt-16"
        >
          <span className="h-px w-10 bg-[var(--brand-secondary)]" aria-hidden="true" />
          <span className="font-sans text-xs font-extrabold tracking-[0.22em] sm:text-sm" style={{ color: muted }}>
            {FOOTER_NOTE}
          </span>
          <span className="h-px w-10 bg-[var(--brand-primary)]" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
