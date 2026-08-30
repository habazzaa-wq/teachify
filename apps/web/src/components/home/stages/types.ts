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
  /** Editorial hero flag — a flagged stage (or the first by default) opens
   *  as the front card in `StagesCardFileSection`. */
  featured?: boolean;
}

/**
 * Per-stage accent system. Each stage owns **one** brand color (never a blend
 * of the two), so the section reads as "warm terracotta → achievement gold"
 * journey where every card is clearly its own color. The progression also moves
 * soft → deep within that single hue.
 *
 * Each preset installs four CSS custom properties (light + dark variants):
 *   --stage-color        main accent (theme-aware stop)
 *   --stage-color-soft   lighter same-hue stop (badge gradient start)
 *   --stage-color-deep   deeper same-hue stop (badge gradient end)
 *   --stage-fg           legible foreground for the badge
 *
 * The class strings are written out **literally** (never from template
 * literals) so Tailwind can statically scan and generate the arbitrary
 * `--stage-*` properties.
 */
export interface StageAccentPreset {
  className: string;
}

/* warm family (primary / terracotta) */
const ACCENT_PRIMARY_SOFT: StageAccentPreset = {
  className:
    "[--stage-color:var(--brand-primary-300)] [--stage-color-soft:var(--brand-primary-200)] [--stage-color-deep:var(--brand-primary-500)] [--stage-fg:var(--brand-primary-900)] " +
    "dark:[--stage-color:var(--brand-primary-500)] dark:[--stage-color-soft:var(--brand-primary-400)] dark:[--stage-color-deep:var(--brand-primary-700)] dark:[--stage-fg:var(--brand-primary-100)]",
};
const ACCENT_PRIMARY: StageAccentPreset = {
  className:
    "[--stage-color:var(--brand-primary-500)] [--stage-color-soft:var(--brand-primary-300)] [--stage-color-deep:var(--brand-primary-700)] [--stage-fg:#ffffff] " +
    "dark:[--stage-color:var(--brand-primary-400)] dark:[--stage-color-soft:var(--brand-primary-300)] dark:[--stage-color-deep:var(--brand-primary-600)] dark:[--stage-fg:#17130d]",
};
/* gold family (secondary) */
const ACCENT_GOLD_SOFT: StageAccentPreset = {
  className:
    "[--stage-color:var(--brand-secondary-300)] [--stage-color-soft:var(--brand-secondary-200)] [--stage-color-deep:var(--brand-secondary-500)] [--stage-fg:var(--brand-secondary-900)] " +
    "dark:[--stage-color:var(--brand-secondary-500)] dark:[--stage-color-soft:var(--brand-secondary-400)] dark:[--stage-color-deep:var(--brand-secondary-700)] dark:[--stage-fg:var(--brand-secondary-100)]",
};
const ACCENT_GOLD: StageAccentPreset = {
  className:
    "[--stage-color:var(--brand-secondary-500)] [--stage-color-soft:var(--brand-secondary-300)] [--stage-color-deep:var(--brand-secondary-700)] [--stage-fg:#17130d] " +
    "dark:[--stage-color:var(--brand-secondary-400)] dark:[--stage-color-soft:var(--brand-secondary-300)] dark:[--stage-color-deep:var(--brand-secondary-600)] dark:[--stage-fg:#17130d]",
};
const ACCENT_GOLD_DEEP: StageAccentPreset = {
  className:
    "[--stage-color:var(--brand-secondary-700)] [--stage-color-soft:var(--brand-secondary-500)] [--stage-color-deep:var(--brand-secondary-900)] [--stage-fg:#ffffff] " +
    "dark:[--stage-color:var(--brand-secondary-300)] dark:[--stage-color-soft:var(--brand-secondary-200)] dark:[--stage-color-deep:var(--brand-secondary-500)] dark:[--stage-fg:#17130d]",
};

/** Ordered journey: warm-soft → warm → gold-soft → gold → gold-deep. */
export const STAGE_ACCENT_ORDER: StageAccentPreset[] = [
  ACCENT_PRIMARY_SOFT,
  ACCENT_PRIMARY,
  ACCENT_GOLD_SOFT,
  ACCENT_GOLD,
  ACCENT_GOLD_DEEP,
];

/** Map a 0..1 progression value to a concrete single-color accent preset. */
export function accentForProgress(t: number): StageAccentPreset {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (STAGE_ACCENT_ORDER.length - 1));
  return STAGE_ACCENT_ORDER[idx]!;
}

/** Literal Tailwind class string that installs a stage's CSS vars. */
export function accentClass(preset: StageAccentPreset): string {
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
    featured: (item as Partial<EducationalStage>).featured,
  };
}
