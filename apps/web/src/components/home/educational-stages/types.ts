/**
 * Data contract for the "Educational Stages" homepage section.
 *
 * The section is fully data-driven and reuses the platform's established
 * `EducationalStage` model (see `@/components/home/stages/types`) — the same
 * shape used by the homepage everywhere else — so every stage carries its own
 * accent color, icon, key-benefit line and navigation target.
 *
 * Each stage is rendered as a premium tile in the responsive mosaic and can
 * also surface live per-stage stats (courses / teachers counts) fetched in
 * parallel, so the section feels alive rather than static.
 */
export type { EducationalStage } from "../stages/types";
export type { StageStatsLike } from "./StageCard";
