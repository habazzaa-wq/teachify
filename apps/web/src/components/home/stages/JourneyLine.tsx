"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Point {
  x: number;
  y: number;
}

/**
 * The "learning journey" thread for the desktop/tablet grid.
 *
 * Instead of a fixed decorative sine, it is **measured**: we read the real
 * rendered center of every stage card and weave a smooth curve through them,
 * with a milestone dot on each. Because positions are recomputed on resize via
 * ResizeObserver, the line stays perfectly aligned to the cards at every
 * breakpoint (2 / 3 / 4 columns) and when images load. It draws itself in with
 * an SVG `pathLength` animation as the section scrolls into view, and the whole
 * thing is purely decorative (aria-hidden).
 *
 * The thread itself uses a single brand color (no two-color blend); each
 * milestone dot carries that stage's own accent color.
 */
export function JourneyLine({
  gridRef,
  accents,
  className,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  accents: string[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; pts: Point[] }>({ w: 0, h: 0, pts: [] });

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const grid = gridRef.current;
    if (!svg || !grid) return;

    const measure = () => {
      const sRect = svg.getBoundingClientRect();
      const children = Array.from(grid.children) as HTMLElement[];
      if (children.length === 0) return;
      const pts: Point[] = children.map((el) => {
        const r = el.getBoundingClientRect();
        // sit the node near the floating icon badge (upper area of the card)
        const y = r.top + r.height * 0.34 - sRect.top;
        const x = r.left + r.width / 2 - sRect.left;
        return { x, y };
      });
      setGeo({ w: sRect.width, h: Math.max(sRect.height, 1), pts });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    ro.observe(grid);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gridRef]);

  // Smooth thread: cubic segments with horizontal control points (horizontal
  // tangents at every node) — reads as a calm, flowing connector, not a zigzag.
  const buildPath = (pts: Point[]): string => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;
    let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const mx = (a.x + b.x) / 2;
      d += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
    }
    return d;
  };

  const path = buildPath(geo.pts);
  const show = geo.pts.length >= 2 && path.length > 0;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox={show ? `0 0 ${geo.w} ${geo.h}` : "0 0 100 100"}
      preserveAspectRatio="none"
      fill="none"
    >
      {show ? (
        <>
          <motion.path
            d={path}
            stroke="var(--brand-primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeOpacity={0.4}
            className="dark:stroke-[var(--brand-primary-400)]"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={reduce ? undefined : { duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />

          {geo.pts.map((p, i) => (
            <motion.g
              key={i}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={reduce ? undefined : { duration: 0.4, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <circle cx={p.x} cy={p.y} r={9} fill="var(--stage-color)" opacity={0.18} className={cn(accents[i])} />
              <circle
                cx={p.x}
                cy={p.y}
                r={4.5}
                className={cn(accents[i])}
                style={{ fill: "var(--stage-color)" }}
                stroke="var(--background)"
                strokeWidth={2}
              />
            </motion.g>
          ))}
        </>
      ) : null}
    </svg>
  );
}
