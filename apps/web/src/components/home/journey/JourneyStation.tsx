"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ArrowDown, ArrowLeft, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { StageStats } from "@/features/homepage/educational-stages/types";
import { accentClass, accentForProgress, type EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";
import { tapFeedback } from "../stages/feedback";
import { anchorPercent } from "./geometry";
import type { JourneyFlow, JourneyStationAnchor } from "./types";

/** Soft brand-tinted blur placeholder (no broken-image flash). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

interface JourneyStationProps {
  stage: EducationalStage;
  index: number;
  total: number;
  flow: JourneyFlow;
  anchor: JourneyStationAnchor;
  size: { width: number; height: number };
  /** RTL pointer used to pick the forward arrow direction. */
  rtl: boolean;
  priority?: boolean;
  /** Optional "recommended" stage — rendered slightly larger & brighter. */
  emphasize?: boolean;
  stats?: StageStats | null;
  loadingStats?: boolean;
  /** Scroll progress of the section (mobile only) — each station fades in as
   *  the path "reaches" it. Null on the horizontal/reduced-motion map. */
  scrollYProgress?: MotionValue<number> | null;
}

/** Node + label + CTA cluster, shared between both reveal modes. */
function StationContent({
  stage,
  flow,
  anchor,
  rtl,
  emphasize,
  priority,
  stats,
  loadingStats,
  accentCls,
  reduce,
}: {
  stage: EducationalStage;
  flow: JourneyFlow;
  anchor: JourneyStationAnchor;
  rtl: boolean;
  emphasize: boolean;
  priority: boolean;
  stats?: StageStats | null;
  loadingStats: boolean;
  accentCls: string;
  reduce: boolean | null;
}) {
  const vertical = flow === "vertical";
  const labelAbove = !vertical && anchor.row === -1;
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;
  const href = stage.href ?? `/stages/${stage.id}`;

  return (
    <Link
      href={href}
      aria-label={`${stage.name} — استكشف المرحلة`}
      onClick={tapFeedback}
      className="group relative block outline-none"
    >
      {/* name / descriptor / stats label — reads on the outer edge */}
      <div
        className={cn(
          "absolute w-40 md:w-44 text-center",
          labelAbove ? "bottom-[54px] md:bottom-[62px]" : "top-[54px] md:top-[62px]",
        )}
        style={{ left: 0, transform: "translateX(-50%)" }}
      >
        <div className="rounded-2xl border border-border/70 bg-card/85 px-3 py-2 shadow-soft-xs backdrop-blur-sm transition-all duration-300 ease-brand group-hover:border-[color-mix(in_srgb,var(--stage-color)_40%,transparent)] group-hover:bg-card group-hover:shadow-soft-md dark:bg-card/60">
          <h3
            className={cn(
              "text-sm font-extrabold leading-tight transition-colors duration-300 ease-brand group-hover:text-[var(--stage-color)]",
              emphasize && "text-[var(--stage-color)]",
            )}
          >
            {stage.name}
          </h3>
          {stage.meta ? (
            <p className="mt-0.5 text-[11px] font-semibold text-[color-mix(in_srgb,var(--stage-color)_80%,black)] dark:text-[color-mix(in_srgb,var(--stage-color)_75%,white)]">
              {stage.meta}
            </p>
          ) : null}
          {stage.description ? (
            <p
              className={cn(
                "mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground/70 transition-opacity duration-300",
                "group-hover:text-muted-foreground group-hover:opacity-100",
              )}
            >
              {stage.description}
            </p>
          ) : null}
          {stats || loadingStats ? (
            <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                {loadingStats ? (
                  <span className="h-3 w-10 animate-pulse rounded-full bg-muted-foreground/20" />
                ) : (
                  <>{formatNumber(stats?.coursesCount ?? 0)} دورات</>
                )}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                {loadingStats ? (
                  <span className="h-3 w-10 animate-pulse rounded-full bg-muted-foreground/20" />
                ) : (
                  <>{formatNumber(stats?.teachersCount ?? 0)} مدرّسين</>
                )}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* the node — centered exactly on the path anchor */}
      <div className={cn("absolute left-0 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 md:h-24 md:w-24", accentCls)}>
        <motion.div
          className={cn(
            "relative h-full w-full rounded-full",
            "ring-4 ring-transparent ring-offset-4 ring-offset-background",
            "transition-shadow duration-200 group-focus-visible:ring-[color-mix(in_srgb,var(--stage-color)_50%,transparent)]",
          )}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.965 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          {/* soft glow behind the node */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute -inset-3 rounded-full blur-xl transition-opacity duration-300",
              "bg-[color-mix(in_srgb,var(--stage-color)_32%,transparent)] opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100",
              !reduce && "animate-brand-glow-pulse",
            )}
          />

          {/* slow-rotating gradient ring */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute -inset-1.5 rounded-full",
              "[background:conic-gradient(from_0deg,var(--brand-primary-300),var(--brand-secondary-500),var(--brand-primary-600),var(--brand-secondary-300),var(--brand-primary-300))]",
              "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]",
              "[padding:3px]",
              "opacity-85 transition-opacity duration-300 group-hover:opacity-100",
              !reduce && "animate-journey-ring group-hover:[animation-duration:7s]",
            )}
          />

          {/* static brand ring underlay for the resting look */}
          <span
            aria-hidden="true"
            className="absolute -inset-1.5 rounded-full border-2 border-[color-mix(in_srgb,var(--stage-color)_30%,transparent)] transition-colors duration-300 group-hover:border-[color-mix(in_srgb,var(--stage-color)_55%,transparent)]"
          />

          {/* circular image mask */}
          <span className="absolute inset-0 overflow-hidden rounded-full border-2 border-white/60 bg-muted dark:border-white/10">
            {hasImage ? (
              <Image
                src={stage.image as string}
                alt={stage.name}
                fill
                sizes="(min-width: 768px) 96px, 80px"
                priority={priority}
                loading={priority ? undefined : "lazy"}
                placeholder="blur"
                blurDataURL={BRAND_BLUR_DATA_URL}
                className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.07]"
                onError={() => setFailed(true)}
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, color-mix(in srgb, var(--stage-color-soft) 90%, transparent), color-mix(in srgb, var(--stage-color-deep) 78%, transparent))",
                }}
              >
                <span
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "radial-gradient(color-mix(in srgb, var(--stage-color) 38%, transparent) 1.4px, transparent 1.4px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <StageIcon name={stage.icon ?? "auto"} className="h-9 w-9" />
              </span>
            )}
            {/* soft brand tint over the photo for cohesion */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[linear-gradient(160deg,color-mix(in_srgb,var(--stage-color)_26%,transparent),transparent_55%)]"
            />
          </span>

          {/* floating icon badge */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute -start-3 -top-3 flex h-9 w-9 items-center justify-center rounded-xl shadow-soft-md md:h-10 md:w-10",
              "text-[var(--stage-fg)]",
              !reduce && "animate-brand-float",
            )}
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--stage-color-soft), var(--stage-color-deep))",
            }}
          >
            <StageIcon name={stage.icon ?? "auto"} className="h-4 w-4 md:h-5 md:w-5" />
          </span>

          {/* primary CTA — overlaps the node edge in the travel direction */}
          <span
            className={cn(
              "absolute flex h-9 w-9 items-center justify-center rounded-full shadow-brand-sm md:h-10 md:w-10",
              "text-[var(--stage-fg)]",
              "opacity-90 transition-all duration-300 ease-brand group-hover:scale-110 group-hover:opacity-100 group-hover:shadow-brand-md",
              vertical
                ? "-bottom-2 left-1/2 -translate-x-1/2"
                : cn("-bottom-2", rtl ? "-end-2" : "-start-2"),
            )}
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--stage-color-soft), var(--stage-color-deep))",
            }}
          >
            {vertical ? (
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </motion.div>
      </div>
    </Link>
  );
}

/** Vertical map: fade/scale each station in as the path reaches its anchor. */
function StationScrollReveal({
  progress,
  index,
  total,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  children: React.ReactNode;
}) {
  const t = total > 1 ? index / (total - 1) : 0;
  const opacity = useTransform(progress, [Math.max(0, t - 0.09), Math.min(1, t + 0.04)], [0.3, 1]);
  const scale = useTransform(progress, [Math.max(0, t - 0.09), Math.min(1, t + 0.02)], [0.9, 1]);
  return (
    <motion.span className="relative block h-0 w-0" style={{ opacity, scale }}>
      {children}
    </motion.span>
  );
}

export function JourneyStation(props: JourneyStationProps) {
  const {
    stage,
    index,
    total,
    flow,
    anchor,
    size,
    rtl,
    priority = false,
    emphasize = false,
    stats,
    loadingStats = false,
    scrollYProgress = null,
  } = props;
  const reduce = useReducedMotion();
  const accent = accentForProgress(total > 1 ? index / (total - 1) : 0);
  const accentCls = accentClass(accent);
  const pct = anchorPercent(anchor, size);
  const vertical = flow === "vertical";

  const content = (
    <StationContent
      stage={stage}
      flow={flow}
      anchor={anchor}
      rtl={rtl}
      emphasize={emphasize}
      priority={priority}
      stats={stats}
      loadingStats={loadingStats}
      accentCls={accentCls}
      reduce={reduce}
    />
  );

  return (
    <li className={cn("absolute z-10", accentCls)} style={{ left: pct.left, top: pct.top }}>
      <div className="relative h-0 w-0">
        {vertical && !reduce && scrollYProgress ? (
          <StationScrollReveal progress={scrollYProgress} index={index} total={total}>
            {content}
          </StationScrollReveal>
        ) : (
          <motion.div
            className="relative h-0 w-0"
            initial={reduce ? false : { opacity: 0, scale: 0.86, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, scale: emphasize ? 1.08 : 1, y: 0 }}
            viewport={reduce ? undefined : { once: true, margin: "0px 0px -10% 0px" }}
            transition={
              reduce
                ? undefined
                : { duration: 0.6, delay: Math.min(index * 0.12, 0.5), ease: [0.22, 1, 0.36, 1] as const }
            }
          >
            {content}
          </motion.div>
        )}
      </div>
    </li>
  );
}