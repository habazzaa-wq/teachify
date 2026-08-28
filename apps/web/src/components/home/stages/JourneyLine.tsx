"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

/**
 * Decorative "learning journey" thread for the desktop grid. A thin, soft
 * gradient line (blending both brand colors) weaves behind the cards and
 * draws itself in via an SVG `pathLength` animation as the section scrolls
 * into view. Small milestone dots sit along the path and pop in sequentially.
 *
 * It is purely decorative (aria-hidden) and never competes with the cards.
 */
export function JourneyLine({ count, className }: { count: number; className?: string }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const gradId = `jg-${uid}`;
  const wave = count < 2 ? 1 : count;

  const samples = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    const x = t * 100;
    const y = 5 + 2.3 * Math.sin(t * Math.PI * wave);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  const d = `M ${samples.join(" L ")}`;

  const dots = Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5) / count) * 100;
    const y = 5 + 2.3 * Math.sin(((i + 0.5) / count) * Math.PI * wave);
    return { x, y };
  });

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand-primary-500)" />
          <stop offset="100%" stopColor="var(--brand-secondary-500)" />
        </linearGradient>
      </defs>

      <motion.path
        d={d}
        stroke={`url(#${gradId})`}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeOpacity={0.4}
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={reduce ? undefined : { duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r="0.9"
          fill="var(--brand-secondary-500)"
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          whileInView={reduce ? undefined : { scale: 1, opacity: 0.85 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={reduce ? undefined : { duration: 0.4, delay: 0.5 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}
