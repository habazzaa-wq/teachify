/**
 * Data contract for the "Educational Stages" homepage section.
 *
 * The section is fully data-driven and reuses the platform's established
 * `EducationalStage` model (see `@/components/home/stages/types`) — the same
 * shape already used by the homepage everywhere else — so every stage carries
 * its own accent color, icon, key-benefit line and navigation target.
 *
 * The section renders the native card-file deck (`StagesCardFileSection`); this
 * module only re-exports the shared model for consumers (tests / preview).
 */
export type { EducationalStage } from "../stages/types";
