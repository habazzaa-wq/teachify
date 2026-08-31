/**
 * Data contract for the "Educational Stages" homepage section — a dimensional,
 * bento-style "world map" of stage cards.
 *
 * The section is fully data-driven and reuses the platform's established
 * `EducationalStage` model (the same shape used across the public site), so
 * every stage carries its own name, copy, photo, accent color, icon and
 * navigation target. Nothing is hardcoded inside the components.
 */

export type { EducationalStage } from "../stages/types";

/** Live per-stage metrics surfaced on each card (from the public API). */
export interface StageStatsLike {
  coursesCount: number;
  teachersCount: number;
}

/**
 * Composition slot for a stage inside the bento mosaic.
 *
 * `variant` tunes how much visual weight the card carries: the "hero" stage
 * opens the composition large and tall; "standard" cards fill the mosaic; an
 * optional "wide" variant adds horizontal rhythm so the mosaic never reads as
 * four identical boxes regardless of how many stages exist.
 */
export type StageVariant = "hero" | "standard" | "wide";
