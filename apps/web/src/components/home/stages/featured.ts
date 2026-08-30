import type { EducationalStage } from "./types";

/**
 * Result of picking the featured (hero) stage from a list.
 * `rest` preserves the original source order with the featured item removed.
 */
export interface FeaturedPick {
  /** The stage rendered as the large editorial hero card, if any. */
  featured: EducationalStage | null;
  /** True when a hero is rendered (explicit flag or default first). */
  hasFeatured: boolean;
  /** Remaining stages rendered in the even grid, in source order. */
  rest: EducationalStage[];
}

/**
 * Choose which stage gets the hero treatment:
 * - An explicit `featured: true` stage always wins.
 * - With `heroByDefault` (default) and no flag set, the **first** stage is
 *   hero — so a CMS response without featured flags still gets a premium
 *   editorial lead.
 * - With `heroByDefault: false` and no flag, the section degrades cleanly to
 *   a plain even grid (the "always safe" fallback).
 */
export function pickFeaturedStages(
  stages: readonly EducationalStage[],
  opts: { heroByDefault?: boolean } = {},
): FeaturedPick {
  const { heroByDefault = true } = opts;
  if (stages.length === 0) return { featured: null, hasFeatured: false, rest: [] };

  const flagged = stages.findIndex((s) => s.featured === true);
  const featuredIndex = flagged >= 0 ? flagged : heroByDefault ? 0 : -1;

  if (featuredIndex < 0) {
    return { featured: null, hasFeatured: false, rest: stages.slice() };
  }

  const featured = stages[featuredIndex]!;
  const rest = stages.filter((_, i) => i !== featuredIndex);
  return { featured, hasFeatured: true, rest };
}