/**
 * Data contract for the "Split Profile" Educational Stages homepage section.
 *
 * The section is fully data-driven: no stage copy is hardcoded here. Real
 * stages come from the CMS as `EducationalStage` items (see
 * `@/components/home/stages/types`); this component consumes that same shape
 * so the homepage swap is drop-in.
 *
 * Fields used by the section:
 *  · `name`        — display heading (h3), also the CTA link label source.
 *  · `label`       — optional single-line category line under the name
 *                    (mapped from the existing `meta` field, e.g. the age
 *                    range "من ٤ إلى ٦ سنوات"). Rendered only when present.
 *  · `description` — 2–3 line supporting copy.
 *  · `image`       — full-bleed photograph source.
 *  · `href`        — navigation target (defaults to `/stages/{id}`).
 */
import type { EducationalStage } from "../stages/types";

/** The slice of `EducationalStage` this section renders. */
export type StageSectionItem = Pick<
  EducationalStage,
  "id" | "name" | "description" | "image" | "href" | "meta"
>;

/** Map a full `EducationalStage` into the section's consumed shape. */
export function toStageSectionItem(stage: EducationalStage): StageSectionItem {
  return {
    id: stage.id,
    name: stage.name,
    description: stage.description,
    image: stage.image,
    href: stage.href ?? `/stages/${stage.id}`,
    meta: stage.meta,
  };
}
