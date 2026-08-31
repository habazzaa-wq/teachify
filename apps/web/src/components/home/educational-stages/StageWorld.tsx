"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Users } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/cn";
import { stageAccentTokens } from "../stages/accent";
import type { EducationalStage } from "../stages/types";
import { StageIcon } from "../stages/stageIcons";
import type { StageStatsLike, StageVariant } from "./types";

/** Brand-tinted blur placeholder (no broken-image flash on slow networks). */
const BRAND_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

/** Arabic-Indic numerals, e.g. 1 → "١". */
const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

/** Whether the device reports a fine pointer + hover — gates 3D tilt. */
function supportsHover(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/**
 * A number that counts up from `0` to `value` once `active` becomes true.
 * Respects `prefers-reduced-motion` (jumps straight to the final value).
 */
function AnimatedNumber({
  value,
  active,
  className,
}: {
  value: number;
  active: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!active || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce, value]);

  return <span className={cn("tabular-nums", className)}>{arabicNumber(display)}</span>;
}

/* ────────────────────────────────────────────────────────────────
   Tilt surface — the signature dimensionality.
   RotateX/RotateY track the pointer (clamped), spring-smoothed, and flip
   the X axis for RTL so clockwise motion reads clockwise in both scripts.
   The surface is `preserve-3d` so the layered media below parallax with
   independent `translateZ`. Reacts to pointer events only on hover-capable
   devices; on touch it stays flat (the tap-reveal covers mobile).
   ──────────────────────────────────────────────────────────────── */
function TiltSurface({
  tiltEnabled,
  children,
  className,
  style,
}: {
  tiltEnabled: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 240, damping: 20, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 240, damping: 20, mass: 0.6 });

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1 physical (left→right)
    const py = (e.clientY - r.top) / r.height;
    const max = 8;
    const inverse = getComputedStyle(ref.current).direction === "rtl" ? -1 : 1;
    ry.set((px - 0.5) * 2 * max * inverse);
    rx.set((0.5 - py) * 2 * (max * 0.8));
  };

  const onPointerLeave = () => {
    if (!tiltEnabled) return;
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ ...style, rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
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
  active: boolean;
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
  active,
  className,
}: StageWorldProps) {
  const reduce = useReducedMotion();
  const accent = stageAccentTokens(stage, index, total);
  const href = stage.href ?? `/stages/${stage.id}`;
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const hasImage = Boolean(stage.image) && !failed;

  const hoverCapable = useMemo(() => supportsHover(), []);

  const tiltEnabled = !reduce && hoverCapable;
  const showCourses = Boolean(stats && stats.coursesCount > 0);
  const showTeachers = Boolean(stats && stats.teachersCount > 0);
  const isHero = variant === "hero";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 40, rotateX: reduce ? 0 : 10, scale: 0.96 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative [perspective:1200px]", className)}
      style={accent.style && { ...accent.style, transformStyle: "preserve-3d" }}
    >
      <TiltSurface
        tiltEnabled={tiltEnabled}
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-soft-md transition-shadow duration-500 ease-brand",
          "hoverable:hover:shadow-[0_28px_70px_-28px_color-mix(in_srgb,var(--stage-color)_50%,transparent)]",
          accent.className,
        )}
      >
        <Link
          href={href}
          prefetch
          data-open={open || undefined}
          onClick={() => setOpen((o) => !o)}
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
                "data-[open]:translate-y-0",
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
              style={{ transformStyle: "preserve-3d" }}
            >
              {hasImage ? (
                <Image
                  src={stage.image as string}
                  fill
                  sizes="(min-width: 1280px) 34vw, (min-width: 1024px) 44vw, (min-width: 640px) 60vw, 100vw"
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  placeholder="blur"
                  blurDataURL={BRAND_BLUR_DATA_URL}
                  alt={stage.name}
                  className={cn(
                    "object-cover transition-transform duration-[1.2s] ease-brand hoverable:group-hover:scale-[1.06]",
                    isHero && priority && "animate-slow-zoom",
                  )}
                  style={{ transform: "translateZ(24px)" }}
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
                  reduce ? "" : "animate-drift",
                )}
                style={{ ["--drift-rot" as string]: "-6deg" }}
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
                    <AnimatedNumber value={stats.coursesCount} active={active} className="text-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">منهج</span>
                  </span>
                ) : null}
                {showTeachers ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    <Users className="h-4 w-4 text-[var(--stage-color)]" aria-hidden="true" />
                    <AnimatedNumber value={stats.teachersCount} active={active} className="text-foreground" />
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
      </TiltSurface>
    </motion.article>
  );
}
