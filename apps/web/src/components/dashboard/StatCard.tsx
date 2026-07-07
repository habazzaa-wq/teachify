"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui";
import { formatNumber } from "@/lib/format";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: "primary" | "success" | "warning" | "destructive" | "info";
  loading?: boolean;
  delay?: number;
}

const colorConfig = {
  primary: {
    gradient: "from-primary/20 via-primary/10 to-transparent",
    icon: "bg-primary/10 text-primary",
    border: "hover:border-primary/30",
    accent: "bg-primary",
  },
  success: {
    gradient: "from-success/20 via-success/10 to-transparent",
    icon: "bg-success/10 text-success",
    border: "hover:border-success/30",
    accent: "bg-success",
  },
  warning: {
    gradient: "from-warning/20 via-warning/10 to-transparent",
    icon: "bg-warning/10 text-warning",
    border: "hover:border-warning/30",
    accent: "bg-warning",
  },
  destructive: {
    gradient: "from-destructive/20 via-destructive/10 to-transparent",
    icon: "bg-destructive/10 text-destructive",
    border: "hover:border-destructive/30",
    accent: "bg-destructive",
  },
  info: {
    gradient: "from-cyan-500/20 via-cyan-500/10 to-transparent",
    icon: "bg-cyan-500/10 text-cyan-500",
    border: "hover:border-cyan-500/30",
    accent: "bg-cyan-500",
  },
};

function AnimatedNumber({ value, prefix, suffix, delay = 0 }: { value: number; prefix?: string; suffix?: string; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    ref.current = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplay(current);
      if (step >= steps) {
        clearInterval(ref.current);
      }
    }, duration / steps);

    return () => clearInterval(ref.current);
  }, [started, value]);

  return (
    <span className="animate-count-up tabular-nums">
      {prefix}{formatNumber(display)}{suffix}
    </span>
  );
}

function StatCard({ title, value, prefix, suffix, icon: Icon, trend, color = "primary", loading, delay = 0 }: StatCardProps) {
  const colors = colorConfig[color];

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
        <Skeleton className="mb-1 h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        colors.border,
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          colors.gradient,
        )}
      />

      {/* Accent line */}
      <div className={cn("absolute end-0 top-0 h-1 w-full rounded-t-xl", colors.accent)} />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110", colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.positive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} delay={delay} />
        </p>
      </div>
    </div>
  );
}

export { StatCard };
