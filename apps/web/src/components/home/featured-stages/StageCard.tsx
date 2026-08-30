"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { hexToRgb, mixWithBlack, mixWithWhite } from "@/lib/color";
import { accentClass, accentForProgress, type EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";

export type StageCardVariant = "regular" | "featured";

/** Soft brand-tinted blur placeholder (no broken-image flash). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

interface StageCardProps {
  stage: EducationalStage;
  variant?: StageCardVariant;
  /** Global 0-based position in the full list (drives the warm→gold tonal arc
   *  and the editorial number). */
  order?: number;
  /** Total stages in the section (0..1 → 0..1 accent progression). */
  total?: number;
  /** Eager-load the image (kept true for the hero, false otherwise). */
  priority?: boolean;
  className?: string;
}

/** Per-stage accent: explicit `accentColor` wins, otherwise the shared
 *  warm→gold progression (`accentClass` installs the `--stage-*` CSS vars). */
function accentTokens(
  stage: EducationalStage,
  order: number,
  total: number,
): { className: string; style?: CSSProperties } {
  if (stage.accentColor) {
    const rgb = hexToRgb(stage.accentColor);
    const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 0.5;
    return {
      className: "",
      style: {
        "--stage-color": stage.accentColor,
        "--stage-color-soft": mixWithWhite(stage.accentColor, 0.42),
        "--stage-color-deep": mixWithBlack(stage.accentColor, 0.28),
        "--stage-fg": luminance > 0.62 ? "#1a120b" : "#ffffff",
      } as CSSProperties,
    };
  }
  const t = Math.max(0, Math.min(1, total > 1 ? order / (total - 1) : 0.45));
  return { className: accentClass(accentForProgress(t)) };
}

/** Circular brand-colored icon badge, always on the `start` edge of the image
 *  so it never collides with the `end`-edge editorial number. */
function IconBadge({
  stage,
  size,
  className,
}: {
  stage: EducationalStage;
  size: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full text-[var(--stage-fg)]",
        "shadow-soft-md ring-2 ring-background",
        size,
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--stage-color-soft), var(--stage-color-deep))",
      }}
    >
      <StageIcon name={stage.icon ?? "auto"} className="h-[55%] w-[55%]" />
    </span>
  );
}

/** Small "01 / 02 / …" editorial number on the `end` edge (mirrors the badge). */
function EditorialIndex({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute z-10 rounded-full bg-background/75 px-2.5 py-1 text-[11px] font-black tracking-[0.18em] text-foreground/75 ring-1 ring-border backdrop-blur-sm",
        className,
      )}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

/** Branded placeholder used when a stage has no usable image. */
function BrandPlaceholder({ stage }: { stage: EducationalStage }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in srgb, var(--stage-color-soft) 92%, transparent), color-mix(in srgb, var(--stage-color-deep) 80%, transparent))",
      }}
    >
      <span
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--stage-color) 34%, transparent) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />
      <StageIcon name={stage.icon ?? "auto"} className="relative h-10 w-10 text-[var(--stage-fg)] opacity-80" />
    </span>
  );
}

/**
 * The image region shared by both variants. Always `next/image` + `fill`
 * inside a fixed-aspect-ratio wrapper — intrinsic image dimensions never
 * influence layout, so cards stay pixel-stable on every screen.
 */
function StageVisual({
  stage,
  priority,
  sizes,
  className,
}: {
  stage: EducationalStage;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {hasImage ? (
        <Image
          src={stage.image as string}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          placeholder="blur"
          blurDataURL={BRAND_BLUR_DATA_URL}
          alt={stage.name}
          className="object-cover transition-transform duration-[900ms] ease-brand hoverable:group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
          onError={() => setFailed(true)}
        />
      ) : (
        <BrandPlaceholder stage={stage} />
      )}

      {/* brand-tinted bottom-up gradient keeps overlays/text legible on any photo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, color-mix(in srgb, var(--stage-color-soft) 48%, transparent) 0%, transparent 55%)",
        }}
      />
    </div>
  );
}

const REGULAR_IMAGE_RATIO = "aspect-[4/3]";
const REGULAR_BODY_PADDING = "p-4 sm:p-5";
const FEATURED_IMAGE_RATIO = "aspect-[16/10] sm:aspect-[16/9] md:aspect-auto md:h-full";

/** Pill CTA rendered inside the card link (whole card is the tap target). */
function ExploreCta({ wide }: { wide?: boolean }) {
  return (
    <span
      role="presentation"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-extrabold",
        "bg-[var(--stage-color)] text-[var(--stage-fg)] shadow-soft-xs",
        "transition-all duration-300 ease-brand",
        "hoverable:group-hover:bg-[var(--stage-color-deep)] hoverable:group-hover:shadow-soft-md",
        "active:scale-[0.98]",
        wide ? "w-full" : "w-auto",
      )}
    >
      <span>استكشف</span>
      <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" aria-hidden="true" />
      <ArrowRight className="h-4 w-4 rtl:hidden ltr:block" aria-hidden="true" />
    </span>
  );
}

/**
 * Editorial stage card.
 *
 * `featured`  → full-width editorial split (image | text) on md+; image & text
 *               sit in an equal-height 2-col grid, collapsing to a stacked
 *               image-top layout on phones.
 * `regular`   → fixed `4/3` image + compact body. Body uses `flex-1` + `mt-auto`
 *               so cards in one row always match height and the CTA pins to
 *               the bottom regardless of description length.
 *
 * Every decorative element uses logical (`start`/`end`) positioning so the
 * whole card mirrors flawlessly in RTL. Hover-only effects are gated behind
 * the `hoverable:` variant (`@media (hover: hover) and (pointer: fine)`) so
 * touch devices never get "stuck hover" states.
 */
export function StageCard({
  stage,
  variant = "regular",
  order = 0,
  total = 1,
  priority = false,
  className,
}: StageCardProps) {
  const featured = variant === "featured";
  const accent = accentTokens(stage, order, total);
  const href = stage.href ?? `/stages/${stage.id}`;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card",
        "border border-border/60 shadow-soft-xs",
        "transition-[box-shadow,transform] duration-300 ease-brand",
        "hoverable:hover:-translate-y-1 hoverable:hover:shadow-soft-lg",
        accent.className,
        className,
      )}
      style={accent.style}
    >
      <Link
        href={href}
        aria-label={`${stage.name} — استكشف المرحلة`}
        className="relative flex h-full flex-col outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[var(--stage-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {featured ? (
          /* ——— Featured (editorial hero) ——— */
          <div className="grid md:grid-cols-2">
            <div className="relative">
              <StageVisual
                stage={stage}
                priority={priority}
                sizes="(min-width: 768px) 50vw, 100vw"
                className={FEATURED_IMAGE_RATIO}
              />
              <IconBadge stage={stage} size="h-12 w-12 md:h-14 md:w-14" className="start-4 top-4 md:start-6 md:top-6" />
              <EditorialIndex n={order + 1} className="end-4 top-4 md:end-6 md:top-6" />
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
              {stage.meta ? (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--stage-color-soft)_38%,transparent)] px-3 py-1 text-xs font-bold text-[color-mix(in_srgb,var(--stage-color)_70%,black)] dark:text-[color-mix(in_srgb,var(--stage-color)_72%,white)]">
                  {stage.meta}
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--stage-color)]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--stage-color)]" />
                  المرحلة الرئيسية
                </span>
              )}
              <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {stage.name}
              </h3>
              {stage.description ? (
                <p className="line-clamp-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base sm:line-clamp-none">
                  {stage.description}
                </p>
              ) : null}
              <div className="pt-1">
                <ExploreCta />
              </div>
            </div>
          </div>
        ) : (
          /* ——— Regular grid card ——— */
          <>
            <div className="relative">
              <StageVisual
                stage={stage}
                priority={priority}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className={REGULAR_IMAGE_RATIO}
              />
              <IconBadge stage={stage} size="h-11 w-11 md:h-12 md:w-12" className="start-3 top-3 md:start-4 md:top-4" />
              <EditorialIndex n={order + 1} className="end-3 top-3 md:end-4 md:top-4" />
            </div>
            <div className={cn("flex flex-1 flex-col gap-3", REGULAR_BODY_PADDING)}>
              <h3 className="text-lg font-extrabold leading-snug tracking-tight text-foreground sm:text-xl">
                {stage.name}
              </h3>
              {stage.meta ? (
                <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--stage-color)_75%,black)] dark:text-[color-mix(in_srgb,var(--stage-color)_72%,white)]">
                  {stage.meta}
                </p>
              ) : null}
              {stage.description ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {stage.description}
                </p>
              ) : null}
              <div className="mt-auto pt-2">
                <ExploreCta wide />
              </div>
            </div>
          </>
        )}
      </Link>
    </article>
  );
}