import type { StageItem } from "@/features/homepage/educational-stages/types";

/**
 * Purpose-built icon concepts per educational stage. These map to the
 * hand-tuned illustrations in `stageIcons.tsx` rather than generic stock
 * icons, so each stage reads as its own "world".
 */
export type StageIconKey =
  | "sprout" // رياض أطفال — playful seedling / growth
  | "blocks" // رياض أطفال — building blocks (alt)
  | "book" // ابتدائي — open book
  | "compass" // إعدادي — compass / guidance
  | "trending" // إعدادي — rising growth chart
  | "graduation" // ثانوي — graduation cap
  | "target" // ثانوي — target (alt)
  | "auto"; // resolve from the stage name

/**
 * Data contract for a single educational stage. The section is fully
 * data-driven: no stage copy is hardcoded inside the components. `icon`,
 * `href` and `accentColor` are optional overrides; when omitted they are
 * derived from the name / CMS response.
 */
export interface EducationalStage {
  id: number | string;
  name: string;
  description?: string | null;
  image?: string | null;
  /** Explicit icon override. Falls back to a name-based heuristic. */
  icon?: StageIconKey;
  /** Explicit navigation target. Falls back to `/stages/{id}`. */
  href?: string;
  /** Optional per-stage brand accent (hex) that overrides the gradient. */
  accentColor?: string;
  /** Short age-range / key-benefit line shown under the name. */
  meta?: string;
}

/**
 * Tonal progression (soft → deep) so a parent senses the age/maturity
 * journey at a glance from color weight alone. Each preset installs a pair of
 * `--tone-*` custom properties (light + dark variants) that the badge uses for
 * its gradient + foreground. The class strings are written out **literally**
 * (never built from template literals) so Tailwind can statically scan and
 * generate the arbitrary `--tone-*` properties.
 */
export interface StageTonePreset {
  className: string;
}

export const STAGE_TONE_PRESETS: StageTonePreset[] = [
  {
    // softest — kindergarten (pale pastel badge, dark text)
    className:
      "[--tone-p:var(--brand-primary-200)] [--tone-s:var(--brand-secondary-200)] [--tone-fg:var(--brand-primary-900)] " +
      "dark:[--tone-p:var(--brand-primary-800)] dark:[--tone-s:var(--brand-secondary-800)] dark:[--tone-fg:var(--brand-primary-200)]",
  },
  {
    className:
      "[--tone-p:var(--brand-primary-300)] [--tone-s:var(--brand-secondary-300)] [--tone-fg:var(--brand-primary-900)] " +
      "dark:[--tone-p:var(--brand-primary-700)] dark:[--tone-s:var(--brand-secondary-800)] dark:[--tone-fg:var(--brand-primary-100)]",
  },
  {
    className:
      "[--tone-p:var(--brand-primary-400)] [--tone-s:var(--brand-secondary-400)] [--tone-fg:#ffffff] " +
      "dark:[--tone-p:var(--brand-primary-600)] dark:[--tone-s:var(--brand-secondary-700)] dark:[--tone-fg:var(--brand-primary-100)]",
  },
  {
    className:
      "[--tone-p:var(--brand-primary-500)] [--tone-s:var(--brand-secondary-500)] [--tone-fg:#ffffff] " +
      "dark:[--tone-p:var(--brand-primary-500)] dark:[--tone-s:var(--brand-secondary-600)] dark:[--tone-fg:#17130d]",
  },
  {
    // deepest — secondary / graduation (vivid badge, near-black text on dark)
    className:
      "[--tone-p:var(--brand-primary-600)] [--tone-s:var(--brand-secondary-700)] [--tone-fg:#ffffff] " +
      "dark:[--tone-p:var(--brand-primary-400)] dark:[--tone-s:var(--brand-secondary-500)] dark:[--tone-fg:#17130d]",
  },
];

/** Map a 0..1 progression value to a concrete tone preset (clamped). */
export function toneForProgress(t: number): StageTonePreset {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (STAGE_TONE_PRESETS.length - 1));
  return STAGE_TONE_PRESETS[idx]!;
}

/** Literal Tailwind class string that installs a tone's CSS vars. */
export function toneClass(preset: StageTonePreset): string {
  return preset.className;
}

/** Heuristically pick an icon concept from an Arabic stage name. */
export function resolveStageIcon(name: string | null | undefined): StageIconKey {
  const n = (name ?? "").toLowerCase();
  if (n.includes("روض") || n.includes("رياض") || n.includes("kg") || n.includes("أطفال") || n.includes("طفل")) {
    return "sprout";
  }
  if (n.includes("إعداد") || n.includes("اعداد") || n.includes("متوس") || n.includes(" preparatory")) {
    return "compass";
  }
  if (n.includes("ثان") || n.includes("secondary") || n.includes("علمي") || n.includes("أدبي")) {
    return "graduation";
  }
  if (n.includes("ابتد") || n.includes("primary") || n.includes("أساس") || n.includes("اساس")) {
    return "book";
  }
  return "auto";
}

/** Normalize a CMS `StageItem` into the section's data contract. */
export function toEducationalStage(item: StageItem): EducationalStage {
  const icon = (item as Partial<EducationalStage>).icon ?? resolveStageIcon(item.name);
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    image: item.image,
    icon: icon === "auto" ? resolveStageIcon(item.name) : icon,
    href: item.link ?? `/stages/${item.id}`,
    accentColor: (item as Partial<EducationalStage>).accentColor,
    meta: (item as Partial<EducationalStage>).meta,
  };
}
