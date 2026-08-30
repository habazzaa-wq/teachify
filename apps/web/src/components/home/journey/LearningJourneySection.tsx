"use client";

import { useMemo, useRef } from "react";
import { Flag } from "lucide-react";
import { useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { toEducationalStage } from "../stages/types";
import { JourneyPath } from "./JourneyPath";
import { JourneyStation } from "./JourneyStation";
import { JourneyStationSkeleton } from "./JourneyStationSkeleton";
import { useJourneyGeometry, useJourneyFlow } from "./useJourneyFlow";
import { JOURNEY_SKELETON_COUNT, journeyContainerHeight, pointPercent } from "./geometry";
import type { JourneyStage } from "./types";

const DEFAULT_EYEBROW = "ابدأ رحلتك التعليمية";
const DEFAULT_TITLE_LEAD = "رحلتك الدراسية تبدأ من";
const DEFAULT_TITLE_EMPHASIS = "المرحلة المناسبة";
const DEFAULT_SUBTITLE =
  "اختر محطتك الأولى على الخريطة وشاهد أين يقودك الطريق — كل مرحلة عالمٌ مستقل يتدرّج مع طفلك خطوة بخطوة حتى الوصول إلى القمة.";

interface LearningJourneySectionProps {
  /** Optional pre-loaded stages (CMS response). When omitted the section
   *  fetches its own data, staying fully data-driven. */
  stages?: JourneyStage[];
  eyebrow?: string;
  titleLead?: string;
  titleEmphasis?: string;
  subtitle?: string;
  /** Number of stations to mark `priority` (eager image loading). */
  priorityCount?: number;
  /** Optional "recommended" stage id — rendered slightly larger & brighter. */
  emphasizeId?: number | string | null;
}

export function LearningJourneySection({
  stages: stagesProp,
  eyebrow = DEFAULT_EYEBROW,
  titleLead = DEFAULT_TITLE_LEAD,
  titleEmphasis = DEFAULT_TITLE_EMPHASIS,
  subtitle = DEFAULT_SUBTITLE,
  priorityCount = 0,
  emphasizeId = null,
}: LearningJourneySectionProps) {
  const reduce = useReducedMotion();
  const flow = useJourneyFlow();

  // Data layer (skipped when stages are provided directly).
  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<JourneyStage[]>(
    () => (data?.items ?? []).map((item: StageItem) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;
  const count = stages.length;

  const allIds = useMemo(() => stages.map((s) => Number(s.id)).filter(Number.isFinite), [stages]);
  const { statsById, loadingIds } = useStageStatsState(allIds, stagesProp ? false : true);

  const showSkeleton = isLoading && stagesProp === undefined;
  const displayCount = showSkeleton ? JOURNEY_SKELETON_COUNT : Math.max(count, 1);

  // Geometry adapts to the active flow + stage count (see geometry.ts notes).
  const geometry = useJourneyGeometry(displayCount, true);

  // Scroll-driven path drawing (vertical map): the road "draws itself" as the
  // page scrolls through the section and stations light up as it reaches them.
  const roadRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: roadRef,
    offset: ["start 0.85", "end 0.45"],
  });
  const drawProgress: MotionValue<number> | null = flow === "vertical" && !reduce ? scrollYProgress : null;

  if (count === 0 && !isLoading) return null;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full overflow-hidden bg-muted/40 py-20 sm:py-24"
    >
      {/* decorative depth layer (low-opacity brand blobs + faint dot mesh) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 end-0 h-72 w-72 rounded-full bg-[var(--brand-primary)] opacity-[0.13] blur-3xl" />
        <div className="absolute -bottom-24 start-0 h-80 w-80 rounded-full bg-[var(--brand-secondary)] opacity-[0.11] blur-3xl" />
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

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{subtitle}</p>
        </header>

        {/* the journey map */}
        <div
          ref={roadRef}
          className="relative mt-10 sm:mt-14"
          style={{ height: journeyContainerHeight(displayCount, flow) }}
        >
          {/* the road (SVG underlay) */}
          <JourneyPath
            geometry={geometry}
            mode={showSkeleton ? "static" : flow === "vertical" ? "scroll" : "reveal"}
            progress={drawProgress}
            className="z-0"
          />

          {/* start medallion */}
          {!showSkeleton && count > 0 ? (
            <div
              aria-hidden="true"
              className="absolute z-[5]"
              style={pointPercent(geometry.start, geometry)}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <span
                  className="absolute -inset-2 rounded-full bg-[var(--brand-secondary)] opacity-40 blur-md animate-brand-glow-pulse"
                  aria-hidden="true"
                />
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-secondary-contrast)] shadow-brand-md"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                  }}
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          ) : null}

          {/* stations (ordered — screen readers get the linear journey) */}
          <ol
            role="list"
            aria-label="محطات رحلة المراحل الدراسية"
            className="relative z-10 h-full"
          >
            {showSkeleton
              ? Array.from({ length: JOURNEY_SKELETON_COUNT }).map((_, i) => (
                  <JourneyStationSkeleton
                    key={i}
                    flow={flow}
                    anchor={geometry.stations[i]!}
                    size={geometry}
                  />
                ))
              : stages.map((stage, i) => (
                  <JourneyStation
                    key={String(stage.id)}
                    stage={stage}
                    index={i}
                    total={count}
                    flow={flow}
                    anchor={geometry.stations[i]!}
                    size={geometry}
                    rtl={true}
                    priority={i < priorityCount}
                    emphasize={emphasizeId != null && String(emphasizeId) === String(stage.id)}
                    stats={statsById.get(Number(stage.id))}
                    loadingStats={!stagesProp && loadingIds.has(Number(stage.id))}
                    scrollYProgress={drawProgress}
                  />
                ))}
          </ol>
        </div>
      </div>
    </section>
  );
}