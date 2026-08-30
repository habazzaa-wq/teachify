import type { EducationalStage, StageIconKey } from "../stages/types";

/**
 * Data contract for a single station on the learning journey map.
 *
 * Deliberately reuses the existing section data model (`EducationalStage`)
 * so the journey stays fully data-driven with zero hardcoded copy: `icon`,
 * `href` and `accentColor` are optional overrides derived from the CMS
 * response / stage name when omitted.
 */
export type JourneyStage = EducationalStage;

export type JourneyStageIcon = StageIconKey;

/**
 * How the map is laid out on screen.
 *  · horizontal — desktop/tablet: a wide S-curve read right→left (RTL)
 *  · vertical   — mobile: a top→bottom path, drawn as the page scrolls
 */
export type JourneyFlow = "horizontal" | "vertical";

/** Resolved anchor for one station inside the SVG viewBox coordinate space. */
export interface JourneyStationAnchor {
  x: number;
  y: number;
  /** -1 = upper / start-side row, +1 = lower / end-side row. */
  row: -1 | 1;
}

/**
 * Complete geometry for the journey map, expressed in SVG user coordinates
 * (see `geometry.ts` for how it stays responsive across viewports).
 */
export interface JourneyGeometry {
  flow: JourneyFlow;
  rtl: boolean;
  width: number;
  height: number;
  /** One anchor per stage, in stage order (i-th stage ↔ i-th anchor). */
  stations: JourneyStationAnchor[];
  /** Full smooth path through every anchor (lead-in → lead-out). */
  path: string;
  /** Tiny milestone markers sitting on the path between stations. */
  milestones: { x: number; y: number }[];
  /** Where the "the road begins" medallion should sit. */
  start: { x: number; y: number };
}