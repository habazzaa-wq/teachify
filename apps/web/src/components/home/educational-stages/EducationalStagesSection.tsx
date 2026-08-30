"use client";

import { useMemo } from "react";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { StageRow } from "./StageRow";
import { StageRowSkeleton } from "./StageRowSkeleton";
import { toStageSectionItem, type StageSectionItem } from "./types";

const DEFAULT_TITLE =
  "مراحلنا الدراسية، رحلة متصلة من البداية حتى التميّز";
const DEFAULT_SUBTITLE =
  "قسمنا مسار التعلم إلى مراحل واضحة ومترابطة عبر الأعمار، بمناهج وأدوات صمّمها مختصّون لضمان انتقال سلس ومبني على ما سبقه.";

/**
 * "Split Profile" Educational Stages homepage section.
 *
 * Each stage is a full-width horizontal row: a full-bleed photograph on one
 * side and a brand-tinted content panel on the other, alternating sides down
 * the page (`index % 2`). On tablet & mobile the rows stack image-top/content-
 * below. Framer Motion drives a single scroll-entrance fade+slide per row.
 *
 * Responsive strategy:
 *  · Desktop (≥1024px)  — 2-col grid, image full-bleed to the section edge,
 *    content centred vertically. Rows alternate sides and brand tint.
 *  · Tablet (<1024px)   — stacked, image `16/9`.
 *  · Mobile (<640px)    — stacked, image `4/3`, compact paddings.
 *
 * Data is fully data-driven from the public stages query; a skeleton matching
 * the final geometry is shown while loading (`StageRowSkeleton`).
 */
export function EducationalStagesSection({
  stages: stagesProp,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: {
  /** Optional explicit stage list (used in tests / preview). */
  stages?: EducationalStage[];
  title?: string;
  subtitle?: string;
}) {
  const { data, isLoading } = usePublicStages();

  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;
  const items = useMemo<StageSectionItem[]>(
    () => stages.map(toStageSectionItem),
    [stages],
  );

  if (items.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full overflow-x-hidden bg-[var(--paper)] dark:bg-[var(--paper-dark)]"
    >
      {/* header — start-aligned, no eyebrow, no centered layout */}
      <header className="px-6 pb-16 pt-16 sm:px-8 sm:pt-20 lg:px-16 lg:pt-24">
        <h2
          id="educational-stages-title"
          className="font-display text-4xl font-bold leading-tight text-[var(--ink)] md:text-5xl"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-[var(--ink)]/70">
          {subtitle}
        </p>
      </header>

      {showSkeleton ? (
        <ol className="list-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              {i > 0 && <RowHairline />}
              <StageRowSkeleton index={i} />
            </li>
          ))}
        </ol>
      ) : (
        <ol className="list-none">
          {items.map((item, i) => (
            <li key={String(item.id)}>
              {i > 0 && <RowHairline />}
              <StageRow item={item} index={i} priority={i === 0} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Thin full-width hairline divider between rows (`--ink` at 10%). */
function RowHairline() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full bg-[var(--ink)]/10"
    />
  );
}
