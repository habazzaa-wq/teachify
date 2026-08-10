"use client";

import { useEffect, useState } from "react";
import type { StudentDashboardStats } from "../types";
import { STAT_CARDS, brandColorFor } from "../constants";
import { useBrandTheme, contrastFor } from "./StudentCard";
import { formatNumber } from "@/lib/format";

interface StudentStatCardsProps {
  stats: StudentDashboardStats;
}

function AnimatedNumber({
  value,
  suffix,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      current = Math.min(Math.round(increment * step), value);
      setDisplay(current);
      if (step >= steps) window.clearInterval(id);
    }, duration / steps);
    return () => window.clearInterval(id);
  }, [started, value]);

  return (
    <span className="tabular-nums">
      {formatNumber(display)}
      {suffix}
    </span>
  );
}

export function StudentStatCards({ stats }: StudentStatCardsProps) {
  const t = useBrandTheme();

  return (
    <section aria-label="إحصائيات التعلم" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STAT_CARDS.map((card, index) => {
        const accent = brandColorFor(card.color);

        return (
          <div
            key={card.key}
            className="home-enter-pop group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow,
              animationDelay: `${index * 70}ms`,
            }}
          >
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: accent,
                    color: contrastFor(accent),
                    boxShadow: "0 4px 12px rgba(0,0,0,0.133)",
                  }}
                >
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="text-sm font-medium leading-tight" style={{ color: t.muted }}>
                {card.label}
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight" style={{ color: t.ink }}>
                <AnimatedNumber
                  value={Number(stats[card.key] ?? 0)}
                  suffix={card.suffix}
                  delay={index * 70}
                />
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
