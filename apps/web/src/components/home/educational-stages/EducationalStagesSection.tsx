"use client";

import { useMemo } from "react";
import { useUiStore } from "@/stores/ui.store";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import {
  mergeEducationalStagesSection,
} from "@/features/homepage/educational-stages/types";
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

const FOOTER_NOTE = "ابدأ الرحلة من حيث يناسب سِنّه";

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
 * behind it, a ghost Arabic numeral, and an icon seal. Card interactions use
 * lightweight CSS hover effects rather than per-frame pointer animation.
 * A contents-style stage index in the header gives it a confident, crafted
 * editorial voice that reads as trustworthy to a parent.
 *
 * Architecture (Server/Client boundary):
 *  · Static stage data is already fetched **server-side** in `(home)/page.tsx`
 *    (stagesServerService.getPublicStages) and hydrated into React Query. This
 *    section (a Client Component) reads that cache — no client round-trip — and
  *    adds a Client boundary only where interactivity requires it (Framer Motion
  *    entrance effects and query state). `LazyMount` in the page defers hydration
 *    until the section nears the viewport.
 *
 * Responsiveness: the composition is re-architected per breakpoint, not merely
 * scaled — hero collapses from a wide lead (xl/lg/sm) to the top full-width card
 * on mobile; the index hides below lg; sizes/margins tighten on small screens.
 */
export function EducationalStagesSection({
  stages: stagesProp,
  titleLead: titleLeadProp,
  titleEmphasis: titleEmphasisProp,
  priorityCount = 0,
}: {
  stages?: EducationalStage[];
  titleLead?: string;
  titleEmphasis?: string;
  priorityCount?: number;
}) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const { ref: inViewRef, inView } = useInViewOnce<HTMLElement>({
    rootMargin: "0px 0px -15% 0px",
  });

  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;
  const section = mergeEducationalStagesSection(data?.section);
  const titleLead = titleLeadProp ?? section.titleLead;
  const titleEmphasis = titleEmphasisProp ?? section.titleEmphasis;

  const stageIds = useMemo(
    () => stages.map((s) => Number(s.id)).filter((id) => Number.isFinite(id) && id > 0),
    [stages],
  );
  const { statsById } = useStageStatsState(stageIds, inView);

  if (stages.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  const muted = isDark ? "#A79E92" : "#6E665C";

  return (
    <section
      id="educational-stages"
      ref={inViewRef}
      dir="rtl"
      aria-labelledby="stages-title"
      className="relative w-full scroll-mt-16 overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        background: isDark
          ? "linear-gradient(170deg, #0e0c14 0%, #17121c 55%, #0e0c14 100%)"
          : "linear-gradient(170deg, #fdfbf7 0%, #f6efe3 55%, #fdfbf7 100%)",
      }}
    >
      {/* Keep the background static to avoid scroll-time repaint work. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(rgba(255,255,255,0.035) 0.6px, transparent 0.6px)"
            : "radial-gradient(rgba(120,80,40,0.045) 0.6px, transparent 0.6px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse at 88% 12%, color-mix(in srgb, var(--brand-primary) 10%, transparent), transparent 38%), radial-gradient(ellipse at 12% 88%, color-mix(in srgb, var(--brand-secondary) 9%, transparent), transparent 40%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─────────────────────────  header  ───────────────────────── */}
        <header className="max-w-2xl text-start">
          <h2
            id="stages-title"
            className="font-sans text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span style={{ color: "var(--brand-primary)" }}>{titleLead}</span>{" "}
            <span style={{ color: "var(--brand-secondary)" }}>{titleEmphasis}</span>
          </h2>
        </header>

        {/* ─────────────────────────  bento mosaic  ───────────────────────── */}
        <div className="mt-12 sm:mt-16">
          {showSkeleton ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              <div className="sm:col-span-2 xl:col-span-2">
                <StageWorldSkeleton variant="hero" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={i === 2 ? "xl:col-span-2" : ""}
                >
                  <StageWorldSkeleton variant="standard" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-flow-dense sm:grid-cols-2 sm:gap-6 sm:items-stretch lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
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
                    className={spanClass(i, variant)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ─────────────────────────  closing note  ───────────────────────── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:mt-16">
          <span className="h-px w-10 bg-[var(--brand-secondary)]" aria-hidden="true" />
          <span className="font-sans text-xs font-extrabold tracking-[0.22em] sm:text-sm" style={{ color: muted }}>
            {FOOTER_NOTE}
          </span>
          <span className="h-px w-10 bg-[var(--brand-primary)]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
