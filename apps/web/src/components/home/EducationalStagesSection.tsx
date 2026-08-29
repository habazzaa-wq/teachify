"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { StageCard } from "./stages/StageCard";
import { StageCardSkeleton } from "./stages/StageCardSkeleton";
import { JourneyLine } from "./stages/JourneyLine";
import {
  toEducationalStage,
  accentClass,
  accentForProgress,
  type EducationalStage,
} from "./stages/types";
import { triggerHaptic } from "./stages/feedback";

const DEFAULT_EYEBROW = "اختار المرحلة المناسبة لك";
const DEFAULT_TITLE_LEAD = "عالمك التعليمي يبدأ من";
const DEFAULT_TITLE_EMPHASIS = "المراحل الدراسية";
const DEFAULT_SUBTITLE =
  "من الروضة حتى الثانوية — كل مرحلة لها عالمها الخاص، ومسار واضح ينمو مع طفلك خطوة بخطوة.";

interface EducationalStagesSectionProps {
  /** Optional pre-loaded stages (CMS response). When omitted the section
   *  fetches its own data, staying fully data-driven. */
  stages?: EducationalStage[];
  eyebrow?: string;
  titleLead?: string;
  titleEmphasis?: string;
  subtitle?: string;
  /** Number of cards to mark `priority` (eager) — default 0 (below the fold). */
  priorityCount?: number;
}

export function EducationalStagesSection({
  stages: stagesProp,
  eyebrow = DEFAULT_EYEBROW,
  titleLead = DEFAULT_TITLE_LEAD,
  titleEmphasis = DEFAULT_TITLE_EMPHASIS,
  subtitle = DEFAULT_SUBTITLE,
  priorityCount = 0,
}: EducationalStagesSectionProps) {
  const reduce = useReducedMotion();

  // Data layer (skipped when stages are provided directly).
  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item: StageItem) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;
  const count = stages.length;

  // Per-stage single-color accent (warm → gold journey), reused for the journey
  // milestones + mobile indicators so the whole section shares one color system.
  const accents = useMemo(
    () => stages.map((_, i) => accentClass(accentForProgress(count > 1 ? i / (count - 1) : 0))),
    [stages, count],
  );

  const allIds = useMemo(() => stages.map((s) => Number(s.id)).filter(Number.isFinite), [stages]);
  const { statsById, loadingIds } = useStageStatsState(allIds, stagesProp ? false : true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const prevActive = useRef(0);
  const [activeMobile, setActiveMobile] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0;
    setScrollProgress(p);

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    children.forEach((c, i) => {
      const cc = c.offsetLeft + c.offsetWidth / 2;
      const dist = Math.abs(cc - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== prevActive.current) {
      prevActive.current = best;
      setActiveMobile(best);
      triggerHaptic(6); // soft tick when a new card snaps into focus
    }
  };

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    triggerHaptic(10);
  };

  useEffect(() => {
    if (count === 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    const onResize = () => onScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [count]);

  if (count === 0 && !isLoading) return null;

  const showSkeleton = isLoading && stagesProp === undefined;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full overflow-hidden bg-muted/40 py-20 sm:py-24"
    >
      {/* decorative depth layer (low-opacity brand blobs + faint dot mesh) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 end-0 h-72 w-72 rounded-full bg-[var(--brand-primary)] opacity-[0.14] blur-3xl" />
        <div className="absolute -bottom-24 start-0 h-80 w-80 rounded-full bg-[var(--brand-secondary)] opacity-[0.12] blur-3xl" />
        <div className="absolute inset-0 bg-dot opacity-[0.045]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-secondary)_45%,transparent)] bg-[color-mix(in_srgb,var(--brand-secondary)_15%,transparent)] px-3 py-1 text-xs font-bold text-[color-mix(in_srgb,var(--brand-secondary-700)_90%,black)] dark:text-[color-mix(in_srgb,var(--brand-secondary-200)_92%,white)]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary-500)]" />
            {eyebrow}
          </span>

          <h2
            id="educational-stages-title"
            className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {titleLead}{" "}
            <span className="bg-gradient-to-r from-[var(--brand-primary-400)] via-[var(--brand-primary-500)] to-[var(--brand-primary-700)] bg-clip-text text-transparent">
              {titleEmphasis}
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </header>

        {/* grid / mobile carousel + decorative journey thread (measured, aligned) */}
        <div className="relative mt-12">
          {!showSkeleton && count > 0 ? (
            <JourneyLine
              gridRef={scrollerRef}
              accents={accents}
              className="absolute inset-0 z-0 hidden md:block"
            />
          ) : null}

          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className={cn(
              // mobile: horizontal snap carousel with peek-preview
              "max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:pb-2 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden",
              // tablet / desktop: responsive grid
              "md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4",
              "relative z-10",
            )}
          >
            {showSkeleton
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="max-md:min-w-[78%] max-md:snap-center">
                    <StageCardSkeleton />
                  </div>
                ))
              : stages.map((stage, i) => (
                  <div key={stage.id} className="max-md:min-w-[78%] max-md:snap-center">
                    <StageCard
                      stage={stage}
                      index={i}
                      total={count}
                      priority={i < priorityCount}
                      stats={statsById.get(Number(stage.id))}
                      loadingStats={!stagesProp && loadingIds.has(Number(stage.id))}
                    />
                  </div>
                ))}
          </div>
        </div>

        {/* mobile: progress bar + dot indicators */}
        {!showSkeleton && count > 1 ? (
          <div className="mt-6 md:hidden">
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/60" aria-hidden="true">
              <div
                className={cn(
                  "h-full rounded-full bg-[var(--stage-color)] transition-[width] duration-150 ease-brand",
                  accents[activeMobile],
                )}
                style={{ width: `${Math.max(scrollProgress * 100, (activeMobile + 1) / count * 100)}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="مراحل المسار">
              {stages.map((stage, i) => (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={i === activeMobile ? "true" : undefined}
                  aria-label={stage.name}
                  onClick={() => scrollToIndex(i)}
                  className={cn(
                    "h-2 rounded-full outline-none transition-all duration-300 ease-brand focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--stage-color)_45%,transparent)]",
                    accents[i],
                    i === activeMobile
                      ? "w-6 bg-[var(--stage-color)]"
                      : "w-2 bg-[color-mix(in_srgb,var(--stage-color)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--stage-color)_55%,transparent)]",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
