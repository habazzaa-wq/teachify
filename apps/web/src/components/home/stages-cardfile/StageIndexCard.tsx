"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { stageAccentTokens } from "../stages/accent";
import type { EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";

/** Brand-tinted blur placeholder (no broken-image flash). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

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

/** The mounted-print photo window: `next/image` fill inside a fixed-aspect
 *  mat, so intrinsic image dimensions never influence the card's layout. */
function StagePhoto({ stage, priority }: { stage: EducationalStage; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;

  return (
    <>
      {hasImage ? (
        <Image
          src={stage.image as string}
          fill
          sizes="(min-width: 1024px) 46vw, 100vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          placeholder="blur"
          blurDataURL={BRAND_BLUR_DATA_URL}
          alt={stage.name}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <BrandPlaceholder stage={stage} />
      )}
    </>
  );
}

interface StageIndexCardProps {
  stage: EducationalStage;
  /** 0-based position in the full list (drives the accent progression). */
  order?: number;
  total?: number;
  /** Catalogue number printed on the corner tab (Arabic-Indic numerals). */
  tabLabel?: string;
  priority?: boolean;
  className?: string;
}

/**
 * The opened "pull-forward" card of the catalogue file. A corner index tab is
 * physically attached to the card (sticks above the top edge — it is part of
 * the paper, not a floating badge). The photo sits in a matted window like a
 * mounted print; the body carries a stamped rule under the display-face name.
 */
export function StageIndexCard({
  stage,
  order = 0,
  total = 1,
  tabLabel = "١",
  priority = false,
  className,
}: StageIndexCardProps) {
  const accent = stageAccentTokens(stage, order, total);
  const href = stage.href ?? `/stages/${stage.id}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft-md",
        accent.className,
        className,
      )}
      style={accent.style}
    >
      <span
        aria-hidden="true"
        className="absolute -top-[15px] start-6 z-20 inline-flex min-h-[30px] items-center rounded-t-md rounded-b-[4px] px-3 font-display text-sm font-bold leading-none text-[var(--stage-fg)] shadow-soft-xs"
        style={{ backgroundColor: "var(--stage-color)" }}
      >
        {tabLabel}
      </span>

      <Link
        href={href}
        aria-label={`${stage.name} — استكشف المرحلة`}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--stage-color)] lg:flex-row"
      >
        <div className="p-2.5 sm:p-3 lg:w-[46%]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted ring-1 ring-border/60 sm:aspect-[16/9] lg:aspect-auto lg:h-full">
            <StagePhoto stage={stage} priority={priority} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 p-5 pt-1 sm:p-7 sm:pt-2 lg:p-10">
          {stage.meta ? (
            <p className="text-xs font-bold text-[var(--stage-color)] sm:text-sm">
              {stage.meta}
            </p>
          ) : null}
          <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {stage.name}
          </h3>
          <span aria-hidden="true" className="h-px w-14 bg-[var(--stage-color)]" />
          {stage.description ? (
            <p className="line-clamp-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
              {stage.description}
            </p>
          ) : null}
          <span
            role="presentation"
            className="mt-1 inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--stage-color)] transition-all duration-300 ease-brand hoverable:group-hover:gap-3"
          >
            <span className="underline decoration-foreground/30 underline-offset-4 transition-colors duration-300 hoverable:group-hover:decoration-[var(--stage-color)]">
              استكشف المرحلة
            </span>
            <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" aria-hidden="true" />
            <ArrowRight className="h-4 w-4 rtl:hidden ltr:block" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}