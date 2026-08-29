"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { StageIcon } from "./stageIcons";
import { accentClass, accentForProgress, type EducationalStage } from "./types";
import type { StageStats } from "@/features/homepage/educational-stages/types";
import { tapFeedback } from "./feedback";

/** Soft brand-tinted blur placeholder (no broken-image flash). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

interface StageCardProps {
  stage: EducationalStage;
  index: number;
  total: number;
  priority?: boolean;
  stats?: StageStats;
  loadingStats?: boolean;
  onActivate?: () => void;
}

/* Branded fallback when a stage has no image — a soft single-hue gradient +
   dot mesh tinted with the stage's own accent color, never a broken glyph. */
function StagePlaceholder({ icon, accentClass: ac }: { icon: EducationalStage["icon"]; accentClass: string }) {
  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", ac)}
      aria-hidden="true"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in srgb, var(--stage-color-soft) 90%, transparent), color-mix(in srgb, var(--stage-color-deep) 78%, transparent))",
      }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--stage-color) 38%, transparent) 1.4px, transparent 1.4px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-3xl shadow-soft-md"
        style={{ background: "linear-gradient(135deg, var(--stage-color-soft), var(--stage-color-deep))", color: "var(--stage-fg)" }}
      >
        <StageIcon name={icon ?? "auto"} className="h-10 w-10" />
      </div>
    </div>
  );
}

export function StageCard({
  stage,
  index,
  total,
  priority = false,
  stats,
  loadingStats = false,
  onActivate,
}: StageCardProps) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;
  const accent = accentForProgress(total > 1 ? index / (total - 1) : 0);
  const href = stage.href ?? `/stages/${stage.id}`;

  return (
    <Link
      href={href}
      aria-label={`${stage.name} — استكشف المرحلة`}
      onClick={() => {
        tapFeedback();
        onActivate?.();
      }}
      className={cn(
        "group relative block rounded-3xl outline-none",
        "focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--stage-color)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <motion.article
        initial={reduce ? false : { opacity: 0, y: 26 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={
          reduce
            ? undefined
            : { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.08, 0.4) }
        }
        whileHover={reduce ? undefined : { y: -8 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        className={cn(
          accentClass(accent),
          "relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
          "shadow-soft-md transition-[transform,box-shadow,border-color] duration-300 ease-brand",
          "group-hover:border-[color-mix(in_srgb,var(--stage-color)_45%,transparent)]",
          "group-hover:shadow-[0_22px_48px_-22px_color-mix(in_srgb,var(--stage-color)_55%,transparent)]",
        )}
      >
        {/* animated gradient-border glow (single hue, pulses gently on hover) */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500",
            "group-hover:opacity-100 group-hover:animate-brand-glow-pulse",
            "[background:var(--stage-color)]",
            "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] [padding:1.5px]",
          )}
        />

        {/* top accent bar */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-20 h-[3px] origin-start scale-x-0 bg-[var(--stage-color)] transition-transform duration-500 ease-brand group-hover:scale-x-100"
        />

        {/* cover */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {hasImage ? (
            <Image
              src={stage.image as string}
              alt={stage.name}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              placeholder="blur"
              blurDataURL={BRAND_BLUR_DATA_URL}
              className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.06]"
              onError={() => setFailed(true)}
            />
          ) : (
            <StagePlaceholder icon={stage.icon} accentClass={accentClass(accent)} />
          )}

          {/* brand-tone overlay — blends the stage's own hue into the photo for
              depth while a darkened base keeps the floating badge legible. No
              flat neutral scrim, no washed-out image. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--stage-color-deep)_55%,black)] via-[color-mix(in_srgb,var(--stage-color)_24%,transparent)] to-[color-mix(in_srgb,var(--stage-color-soft)_38%,transparent)]"
          />

          {/* floating icon badge — this stage's single accent color */}
          <div className="absolute start-4 top-4 z-20">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--stage-fg)] shadow-soft-md",
                !reduce && "animate-brand-float",
              )}
              style={{ backgroundImage: "linear-gradient(135deg, var(--stage-color-soft), var(--stage-color-deep))" }}
            >
              <StageIcon name={stage.icon ?? "auto"} className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{stage.name}</h3>
            {stage.meta ? (
              <p className="mt-1 text-xs font-semibold text-[color-mix(in_srgb,var(--stage-color)_85%,black)] dark:text-[color-mix(in_srgb,var(--stage-color)_80%,white)]">
                {stage.meta}
              </p>
            ) : null}
          </div>

          {stage.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
          ) : null}

          {/* trust stats (real per-stage counts) */}
          {stats || loadingStats ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BookGlyph />
                {loadingStats ? (
                  <span className="h-3.5 w-14 animate-pulse rounded-full bg-muted-foreground/20" />
                ) : (
                  <>{formatNumber(stats?.coursesCount ?? 0)} دورة</>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserGlyph />
                {loadingStats ? (
                  <span className="h-3.5 w-14 animate-pulse rounded-full bg-muted-foreground/20" />
                ) : (
                  <>{formatNumber(stats?.teachersCount ?? 0)} مدرّس</>
                )}
              </span>
            </div>
          ) : null}

          <div className="mt-auto pt-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold",
                "border-[color-mix(in_srgb,var(--stage-color)_40%,transparent)] text-[var(--stage-color)]",
                "transition-all duration-300 ease-brand",
                "group-hover:border-[var(--stage-color)] group-hover:bg-[var(--stage-color)] group-hover:text-white",
                "group-hover:shadow-[0_12px_30px_-14px_var(--stage-color)]",
              )}
            >
              <span>استكشف المرحلة</span>
              <ArrowLeft
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 ease-brand group-hover:-translate-x-1"
              />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function BookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" aria-hidden="true">
      <path d="M12 6.2C10 4.9 7.8 4.9 5.5 5.2v11.1c2.3-.3 4.5-.3 6.5 1 2-1.3 4.2-1.3 6.5-1V5.2C16.2 4.9 14 4.9 12 6.2Z" fill="currentColor" />
    </svg>
  );
}

function UserGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" fill="currentColor" />
      <path d="M5 19.5c0-3.3 3.1-5.2 7-5.2s7 1.9 7 5.2" fill="currentColor" />
    </svg>
  );
}
