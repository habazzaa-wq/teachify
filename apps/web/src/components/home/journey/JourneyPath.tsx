"use client";

import { useId } from "react";
import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";
import type { JourneyGeometry } from "./types";

export type JourneyPathMode = "reveal" | "scroll" | "static";

interface JourneyPathProps {
  geometry: JourneyGeometry;
  /** reveal = draws once when the section scrolls into view (desktop);
   *  scroll = pathLength driven by a MotionValue synced to page scroll (mobile);
   *  static = full path, no animation (skeleton / reduced motion). */
  mode: JourneyPathMode;
  /** Required when mode === "scroll": 0..1 motion value for the drawn length. */
  progress?: MotionValue<number> | null;
  className?: string;
}

/**
 * The road itself: a soft two-brand gradient stroke with a wide, faint glow
 * underlay (kept blur-free for GPU friendliness) and tiny diamond milestones
 * sitting on the curve between stations. Purely decorative — `aria-hidden`.
 */
export function JourneyPath({ geometry, mode, progress, className }: JourneyPathProps) {
  const reduce = useReducedMotion();
  const gradId = useId();
  const effective = reduce ? ("static" as const) : mode;
  const scrollDriven = effective === "scroll";

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full overflow-visible", className)}
      fill="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0.55" gradientUnits="objectBoundingBox">
          <stop offset="0%" style={{ stopColor: "var(--brand-primary)" }} />
          <stop offset="55%" style={{ stopColor: "var(--brand-secondary)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-primary)" }} />
        </linearGradient>
      </defs>

      {/* wide glow underlay — always fully laid so progress reads instantly */}
      <path
        d={geometry.path}
        stroke={`url(#${gradId})`}
        strokeWidth={14}
        strokeLinecap="round"
        opacity={scrollDriven ? 0.14 : 0.22}
        vectorEffect="non-scaling-stroke"
      />

      {/* main gradient road */}
      <motion.path
        d={geometry.path}
        pathLength={1}
        stroke={`url(#${gradId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity={scrollDriven ? 0.95 : 0.9}
        {...(scrollDriven
          ? { style: { pathLength: progress ?? 0 } }
          : effective === "reveal"
            ? {
                initial: { pathLength: 0, opacity: 0 },
                whileInView: { pathLength: 1, opacity: 0.9 },
                viewport: { once: true, margin: "0px 0px -12% 0px" },
                transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] as const },
              }
            : { initial: false })}
      />

      {/* milestone markers between stations */}
      {geometry.milestones.map((m, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: `${m.x}px ${m.y}px` }}
          {...(effective === "reveal"
            ? {
                initial: { scale: 0, opacity: 0 },
                whileInView: { scale: 1, opacity: 0.9 },
                viewport: { once: true, margin: "0px 0px -12% 0px" },
                transition: {
                  duration: 0.45,
                  delay: 0.55 + i * 0.09,
                  ease: [0.22, 1, 0.36, 1] as const,
                },
              }
            : { initial: false })}
          opacity={effective === "reveal" ? undefined : 0.75}
        >
          <g transform={`translate(${m.x} ${m.y})`}>
            <path
              d="M0 -6 L5.4 0 L0 6 L-5.4 0 Z"
              fill={`url(#${gradId})`}
            />
            <circle r={1.8} fill="var(--brand-neutral)" />
          </g>
        </motion.g>
      ))}
    </svg>
  );
}