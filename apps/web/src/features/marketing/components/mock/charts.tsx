import { cn } from "@/lib/cn";

export type ChartTone = "coral" | "gold" | "blue" | "green" | "violet" | "deep";

const TONES: Record<ChartTone, string> = {
  coral: "hsl(var(--mk-primary))",
  gold: "hsl(var(--mk-gold))",
  blue: "hsl(var(--mk-blue))",
  green: "hsl(var(--mk-green))",
  violet: "hsl(var(--mk-violet))",
  deep: "hsl(var(--mk-deep-ink))",
};

/**
 * Deterministic, animated SVG charts for the product mockups. Values are
 * illustrative — the surrounding sections label them as such.
 */

export function AreaChart({
  data,
  tone = "coral",
  height = 120,
  id,
  className,
  delay = 0,
}: {
  data: number[];
  tone?: ChartTone;
  height?: number;
  id: string;
  className?: string;
  delay?: number;
}) {
  const w = 300;
  const max = Math.max(...data);
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - (d / max) * (height - 8) - 4] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const color = TONES[tone];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className={cn("mk-chart w-full", className)}
      style={{ "--mk-delay": `${delay}ms` } as React.CSSProperties}
      preserveAspectRatio="none"
      role="img"
      aria-label="رسم بياني خطي"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mk-area-path"
        pathLength={1}
      />
    </svg>
  );
}

export function BarsChart({
  data,
  tone = "gold",
  height = 90,
  className,
  delay = 0,
}: {
  data: number[];
  tone?: ChartTone;
  height?: number;
  className?: string;
  delay?: number;
}) {
  const w = 200;
  const max = Math.max(...data);
  const gap = 6;
  const bw = (w - gap * (data.length - 1)) / data.length;
  const color = TONES[tone];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className={cn("mk-chart w-full", className)}
      preserveAspectRatio="none"
      role="img"
      aria-label="أعمدة بيانية"
    >
      {data.map((d, i) => {
        const barH = Math.max(4, (d / max) * (height - 4));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={height - barH}
            width={bw}
            height={barH}
            rx={2.5}
            fill={i % 2 === 0 ? color : `${color}55`}
            className="mk-bar-col"
            style={{ "--mk-delay": `${delay + i * 60}ms` } as React.CSSProperties}
          />
        );
      })}
    </svg>
  );
}

export function Donut({
  value,
  segments,
  tone = "coral",
  size = 108,
  stroke = 11,
  label,
  sub,
  className,
  delay = 0,
}: {
  value?: number;
  /** Optional multi-segment breakdown (e.g. traffic sources). Values are percentages. */
  segments?: { value: number; tone: ChartTone }[];
  tone?: ChartTone;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  className?: string;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const total = segments ? segments.reduce((acc, s) => acc + s.value, 0) : 1;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="mk-chart absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--mk-line))"
          strokeWidth={stroke}
        />
        {segments
          ? segments.map((seg, i) => {
              const raw = (seg.value / total) * 100;
              const from = segments.slice(0, i).reduce((acc, s) => acc + (s.value / total) * 100, 0);
              const color = TONES[seg.tone];
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={100}
                  strokeDashoffset={100}
                  className="mk-donut-ring"
                  pathLength={100}
                  style={
                    {
                      "--mk-delay": `${delay + i * 180}ms`,
                      "--mk-from": `${100 - from}`,
                      "--mk-to": `${100 - from - raw}`,
                    } as React.CSSProperties
                  }
                />
              );
            })
          : (() => {
              const v = value ?? 0;
              const color = TONES[tone];
              return (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={100}
                  strokeDashoffset={100}
                  className="mk-donut-ring"
                  pathLength={100}
                  style={
                    {
                      "--mk-delay": `${delay}ms`,
                      "--mk-to": `${100 - v}`,
                    } as React.CSSProperties
                  }
                />
              );
            })()}
      </svg>
      <div className="relative text-center leading-none">
        <div className="text-lg font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
          {label}
        </div>
        {sub && (
          <div className="mt-0.5 text-[0.6rem] font-medium text-[hsl(var(--mk-muted))]">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
