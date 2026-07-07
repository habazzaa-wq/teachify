"use client";

import { useMemo } from "react";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

function DonutChart({ segments, size = 160, strokeWidth = 20, showLegend = true }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const arcs = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
    const cumulativeLengths = segments.reduce<number[]>((acc, s, i) => {
      const prev = acc[i - 1] ?? 0;
      acc.push(prev + (s.value / total) * circumference);
      return acc;
    }, []);

    return segments.map((segment, i) => {
      const percentage = segment.value / total;
      const arcLength = (segment.value / total) * circumference;
      const dashArray = `${arcLength} ${circumference - arcLength}`;
      const dashOffset = -(cumulativeLengths[i - 1] ?? 0);
      return { ...segment, percentage, dashArray, dashOffset };
    });
  }, [segments, circumference]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              style={{
                strokeDashoffset: arc.dashOffset,
              }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {segments.reduce((s, seg) => s + seg.value, 0)}
          </span>
          <span className="text-[10px] text-muted-foreground">المجموع</span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { DonutChart };
