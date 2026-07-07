"use client";

import { useMemo, useId } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradient?: {
    from: string;
    to: string;
  };
  showGrid?: boolean;
  showLabels?: boolean;
}

function AreaChart({
  data,
  height = 200,
  color = "hsl(var(--primary))",
  gradient,
  showGrid = true,
  showLabels = true,
}: AreaChartProps) {
  const gradientId = `area-gradient-${useId()}`;
  const { path, areaPath, gridLines, labels, viewBox } = useMemo(() => {
    if (data.length === 0) {
      return { path: "", areaPath: "", gridLines: [], labels: [], viewBox: `0 0 100 ${height}`, minY: 0, maxY: 100 };
    }

    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1;
    const adjustedMax = maxVal + padding;
    const adjustedMin = Math.max(0, minVal - padding);
    const adjustedRange = adjustedMax - adjustedMin || 1;

    const width = 100;
    const stepX = width / (data.length - 1);

    const points = data.map((d, i) => ({
      x: i * stepX,
      y: height - ((d.value - adjustedMin) / adjustedRange) * height * 0.85 - height * 0.075,
    }));

    // Smooth path using cubic bezier
    const pathParts: string[] = [];
    const areaParts: string[] = [];

    points.forEach((p, i) => {
      if (i === 0) {
        pathParts.push(`M ${p.x} ${p.y}`);
        areaParts.push(`M ${p.x} ${p.y}`);
      } else {
        const prev = points[i - 1]!;
        const cpx1 = prev.x + (p.x - prev.x) / 3;
        const cpy1 = prev.y;
        const cpx2 = prev.x + (2 * (p.x - prev.x)) / 3;
        const cpy2 = p.y;
        pathParts.push(`C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p.x} ${p.y}`);
        areaParts.push(`C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p.x} ${p.y}`);
      }
    });

    // Close area path
    const lastP = points[points.length - 1]!;
    const firstP = points[0]!;
    areaParts.push(`L ${lastP.x} ${height}`);
    areaParts.push(`L ${firstP.x} ${height}`);
    areaParts.push("Z");

    // Grid lines
    const gridCount = 4;
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
      const y = (i / gridCount) * height;
      return { y, label: Math.round(adjustedMax - (i / gridCount) * adjustedRange) };
    });

    // Labels
    const labels = data.map((d) => d.label);

    return {
      path: pathParts.join(" "),
      areaPath: areaParts.join(" "),
      gridLines,
      labels,
      viewBox: `0 0 ${width} ${height}`,
      minY: adjustedMin,
      maxY: adjustedMax,
    };
  }, [data, height]);

  const fromColor = gradient?.from ?? color;
  const toColor = gradient?.to ?? `${color.replace(")", "/0.05)")}`;

  return (
    <div className="w-full">
      <svg viewBox={viewBox} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {showGrid &&
          gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1="0"
                y1={gl.y}
                x2="100"
                y2={gl.y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            </g>
          ))}

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Dots */}
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * 100;
          const val = d.value;
          const maxVal = Math.max(...data.map((p) => p.value));
          const minVal = Math.min(...data.map((p) => p.value));
          const range = maxVal - minVal || 1;
          const padding = range * 0.1;
          const adjustedMax = maxVal + padding;
          const adjustedMin = Math.max(0, minVal - padding);
          const adjustedRange = adjustedMax - adjustedMin || 1;
          const y = height - ((val - adjustedMin) / adjustedRange) * height * 0.85 - height * 0.075;

          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="2.5"
                fill="hsl(var(--background))"
                stroke={color}
                strokeWidth="1.5"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      {showLabels && labels.length > 0 && (
        <div className="mt-2 flex justify-between">
          {labels.map((label, i) => (
            <span
              key={i}
              className="text-[10px] text-muted-foreground/60"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { AreaChart };
