"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { StageIcon } from "./stageIcons";
import { toneClass, toneForProgress, type EducationalStage } from "./types";
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

/* Branded fallback when a stage has no image — a soft gradient + dot mesh
   tinted with the two brand colors, never a broken-image glyph. */
function StagePlaceholder({ icon }: { icon: EducationalStage["icon"] }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary-100) 85%, transparent), color-mix(in srgb, var(--brand-secondary-100) 80%, transparent))",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--brand-primary-300) 40%, transparent) 1.4px, transparent 1.4px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-3xl shadow-soft-xs"
        style={{
          background: "var(--brand-gradient)",
          color: "#ffffff",
        }}
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
  const tone = toneForProgress(total > 1 ? index / (total - 1) : 0);
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
        "focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--brand-primary)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
          "relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
          "shadow-soft-md transition-shadow duration-300",
          "group-hover:shadow-soft-lg",
        )}
      >
        {/* animated gradient-border glow (pulses gently on hover) */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500",
            "group-hover:opacity-100 group-hover:animate-brand-glow-pulse",
            "[background:linear-gradient(135deg,var(--brand-primary-500),var(--brand-secondary-500))]",
            "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] [padding:1.5px]",
            "dark:[background:linear-gradient(135deg,var(--brand-primary-400),var(--brand-secondary-400))]",
          )}
          style={{ backgroundImage: "linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500))" }}
        />

        {/* top accent bar */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-20 h-[3px] origin-start scale-x-0 [background-image:var(--brand-gradient)] transition-transform duration-500 ease-brand group-hover:scale-x-100"
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
              className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.07]"
              onError={() => setFailed(true)}
            />
          ) : (
            <StagePlaceholder icon={stage.icon} />
          )}

          {/* legibility scrim + brand tint blend */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70 mix-blend-soft-light"
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 55%, transparent), color-mix(in srgb, var(--brand-secondary) 45%, transparent))",
            }}
          />

          {/* floating icon badge — tonal progression (soft → deep) */}
          <div className={cn("absolute start-4 top-4 z-20", toneClass(tone))}>
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--tone-fg)] shadow-soft-md",
                !reduce && "animate-brand-float",
              )}
              style={{
                backgroundImage: "linear-gradient(135deg, var(--tone-p), var(--tone-s))",
              }}
            >
              <StageIcon name={stage.icon ?? "auto"} className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {stage.name}
            </h3>
            {stage.meta ? (
              <p className="mt-1 text-xs font-semibold text-[color-mix(in_srgb,var(--brand-primary)_85%,black)] dark:text-[color-mix(in_srgb,var(--brand-primary-200)_90%,white)]">
                {stage.meta}
              </p>
            ) : null}
          </div>

          {stage.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {stage.description}
            </p>
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
                "border-[color-mix(in_srgb,var(--brand-primary)_35%,transparent)] text-[color-mix(in_srgb,var(--brand-primary)_90%,black)]",
                "transition-all duration-300 ease-brand",
                "group-hover:border-transparent group-hover:text-white group-hover:[background-image:var(--brand-gradient)]",
                "group-hover:shadow-brand-sm",
                "dark:text-[color-mix(in_srgb,var(--brand-primary-200)_90%,white)]",
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
