"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { stageAccentTokens } from "../stages/accent";
import type { EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";
import type { StageStatsLike, StageVariant } from "./types";

/** Arabic-Indic numerals, e.g. 1 → "١". */
const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

/**
 * Normalize a stage media URL into a browser-safe `src`. The tenant CMS stores
 * images as either absolute URLs (e.g. `https://picsum.photos/...`) or domain-
 * relative paths served by this Next app (`/storage/...`). Guard against a
 * missing leading slash so `<img>` never resolves against the current route.
 */
function resolveImageSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  return value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `/${value}`;
}

/* ────────────────────────────────────────────────────────────────
   One stage as an interactive "world".
   ──────────────────────────────────────────────────────────────── */
interface StageWorldProps {
  stage: EducationalStage;
  index: number;
  total: number;
  variant: StageVariant;
  priority?: boolean;
  stats?: StageStatsLike | null;
  /** Bento grid span classes (computed by the section). */
  className?: string;
}

export function StageWorld({
  stage,
  index,
  total,
  variant,
  priority = false,
  stats,
  className,
}: StageWorldProps) {
  const accent = stageAccentTokens(stage, index, total);
  const href = stage.href ?? `/stages/${stage.id}`;
  const [failed, setFailed] = useState(false);
  const src = resolveImageSrc(stage.image);
  const hasImage = Boolean(src) && !failed;

  const showCourses = Boolean(stats && stats.coursesCount > 0);
  const showTeachers = Boolean(stats && stats.teachersCount > 0);
  const isHero = variant === "hero";

  return (
    <article
      className={cn("group relative", className)}
      style={accent.style}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-soft-md transition-shadow duration-500 ease-brand",
          "hoverable:hover:shadow-[0_28px_70px_-28px_color-mix(in_srgb,var(--stage-color)_50%,transparent)]",
          accent.className,
        )}
      >
        <Link
          href={href}
          prefetch
          aria-label={`${stage.name} — استكشف المرحلة`}
          className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--stage-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {/* ── media: arch aperture with a hidden accent reveal layer ── */}
          <div className="relative overflow-hidden">
            {/* accent reveal layer — slides up on hover (desktop) / tap (touch) */}
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-[1] transition-transform duration-500 ease-brand",
                "translate-y-[42%] group-hover:translate-y-0 group-focus-visible:translate-y-0",
                isHero ? "rounded-b-[2rem]" : "rounded-b-[1.75rem]",
              )}
              style={{
                backgroundImage:
                  "linear-gradient(160deg, color-mix(in srgb, var(--stage-color-soft) 92%, transparent), color-mix(in srgb, var(--stage-color-deep) 70%, transparent))",
              }}
            >
              <StageIcon
                name={stage.icon ?? "auto"}
                className="absolute -end-4 -top-4 h-40 w-40 text-[var(--stage-fg)] opacity-25"
              />
            </div>

            {/* the photo is inset so the accent frame peeks out behind it */}
            <div
              className={cn(
                "relative z-[2] overflow-hidden bg-muted",
                isHero ? "m-3 h-44 sm:h-56 lg:h-64" : "m-2.5 h-40 sm:h-44 lg:h-48",
              )}
            >
              {hasImage && src ? (
                // eslint-disable-next-line @next/next/no-img-element -- stage images are arbitrary dynamic CMS/media URLs (tenant domains + dev http) that next/image optimization can fail to resolve; a plain lazy-loaded <img> is the resilient, fast choice here.
                <img
                  src={src}
                  alt={stage.name}
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={priority ? "high" : "auto"}
                  draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-brand hoverable:group-hover:scale-[1.06]"
                  onError={() => setFailed(true)}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, color-mix(in srgb, var(--stage-color-soft) 90%, transparent), color-mix(in srgb, var(--stage-color-deep) 76%, transparent))",
                  }}
                >
                  <StageIcon name={stage.icon ?? "auto"} className="h-20 w-20 text-[var(--stage-fg)] opacity-80" />
                </span>
              )}

              {/* image tint for legibility + depth cue */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent"
              />
              {/* ghost Arabic numeral watermark */}
              <span
                aria-hidden="true"
                className={cn(
                  "font-sans absolute -bottom-4 -start-1 z-[3] select-none font-extrabold leading-none text-[var(--stage-fg)] opacity-[0.16] drop-shadow-sm",
                  isHero ? "text-[7rem]" : "text-[5rem]",
                )}
              >
                {arabicNumber(index + 1)}
              </span>
            </div>

            {/* corner seals riding above the photo */}
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[4] flex items-center justify-between">
              <span
                aria-hidden="true"
                className="font-sans flex h-10 w-10 items-center justify-center rounded-xl text-base font-extrabold text-[var(--stage-fg)] shadow-soft-md"
                style={{ backgroundColor: "var(--stage-color)" }}
              >
                {arabicNumber(index + 1)}
              </span>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/15 text-[var(--stage-fg)] shadow-soft-md backdrop-blur-sm"
              >
                <StageIcon name={stage.icon ?? "auto"} className="h-5 w-5" />
              </span>
            </div>
          </div>

          {/* ── body ── */}
          <div className="flex flex-1 flex-col p-5 pt-4 sm:p-6">
            {stage.meta ? (
              <p
                className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide"
                style={{
                  color: "var(--stage-color-deep)",
                  background: "color-mix(in srgb, var(--stage-color-soft) 34%, transparent)",
                }}
              >
                {stage.meta}
              </p>
            ) : null}

            <h3 className="font-sans mt-2.5 text-xl font-extrabold leading-snug tracking-tight text-foreground sm:text-2xl">
              {stage.name}
            </h3>
            <span aria-hidden="true" className="mt-2 h-0.5 w-12 rounded-full bg-[var(--stage-color)]" />

            {stage.description ? (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {stage.description}
              </p>
            ) : null}

            {/* live metrics */}
            {(showCourses || showTeachers) && stats ? (
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
                {showCourses ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    <BookOpen className="h-4 w-4 text-[var(--stage-color)]" aria-hidden="true" />
                    <span className="tabular-nums text-foreground">{arabicNumber(stats.coursesCount)}</span>
                    <span className="text-xs font-bold text-muted-foreground">منهج</span>
                  </span>
                ) : null}
                {showTeachers ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    <Users className="h-4 w-4 text-[var(--stage-color)]" aria-hidden="true" />
                    <span className="tabular-nums text-foreground">{arabicNumber(stats.teachersCount)}</span>
                    <span className="text-xs font-bold text-muted-foreground">معلم</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── CTA bar ── */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-start scale-x-0 bg-[var(--stage-color)] transition-transform duration-500 ease-brand group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3.5 sm:px-6">
            <span className="font-sans text-sm font-extrabold" style={{ color: "var(--stage-color)" }}>
              استكشف المرحلة
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[var(--stage-fg)] transition-transform duration-300 ease-brand",
                "hoverable:group-hover:-translate-x-1 group-active:scale-95",
              )}
              style={{ backgroundColor: "var(--stage-color)" }}
            >
              <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" />
              <ArrowRight className="h-4 w-4 rtl:hidden ltr:block" />
            </span>
          </div>
        </Link>
      </div>
    </article>
  );
}
