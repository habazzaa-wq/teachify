"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  delay?: number;
  duration?: number;
  className?: string;
}

/** Counts up to `value` once the delay elapses (respects reduced motion). */
export function AnimatedNumber({
  value,
  suffix = "",
  delay = 0,
  duration = 850,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = reduced ? 1 : 34;
    const increment = value / steps;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      setDisplay(Math.min(Math.round(increment * step), value));
      if (step >= steps) window.clearInterval(id);
    }, duration / steps);
    return () => window.clearInterval(id);
  }, [started, value, duration]);

  return (
    <span className={className}>
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
