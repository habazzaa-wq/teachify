"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";

interface CompletionRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * Token-driven SVG completion ring.
 * Color scales with readiness: warning → blue → success.
 */
const CompletionRing = memo(function CompletionRing({
  value,
  size = 36,
  strokeWidth = 3.5,
  showLabel = true,
  className,
}: CompletionRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const tone =
    clamped >= 80 ? "text-success" : clamped >= 40 ? "text-blue" : "text-warning";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      role="img"
      aria-label={`اكتمال ${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-all duration-700 ease-out", tone)}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[9px] font-bold tabular-nums text-foreground/80">
          {clamped}
        </span>
      )}
    </div>
  );
});

export { CompletionRing };
