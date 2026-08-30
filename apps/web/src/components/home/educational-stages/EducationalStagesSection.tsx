"use client";

import { StagesCardFileSection } from "../stages-cardfile/StagesCardFileSection";
import type { EducationalStage } from "../stages/types";

/**
 * "Educational Stages" homepage section.
 *
 * Rendered as the platform's own native "card-file" deck (`StagesCardFileSection`):
 * a tab rail of catalogue cards with a fanned preview that pulls a single opened
 * card forward. This guarantees the section is byte-for-byte consistent with the
 * rest of the public site — warm surfaces, per-stage brand accents, matted photo
 * window and stamped card body — rather than inventing a competing look.
 *
 * Data is fully data-driven from the public stages query, with a skeleton
 * matching the final geometry shown while loading.
 */
export function EducationalStagesSection({
  stages,
  priorityCount = 0,
}: {
  /** Optional explicit stage list (used in tests / preview). */
  stages?: EducationalStage[];
  /** Number of non-default cards that eager-load their image too. */
  priorityCount?: number;
}) {
  return <StagesCardFileSection stages={stages} priorityCount={priorityCount} />;
}
