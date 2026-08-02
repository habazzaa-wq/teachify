"use client";

import { AppMetricCard } from "@/components/ui/AppMetricCard";
import type { StudentDashboardStats } from "../types";
import { STAT_CARDS } from "../constants";

interface StudentStatCardsProps {
  stats: StudentDashboardStats;
}

export function StudentStatCards({ stats }: StudentStatCardsProps) {
  return (
    <section aria-label="إحصائيات التعلم" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STAT_CARDS.map((card, index) => (
        <AppMetricCard
          key={card.key}
          title={card.label}
          value={Number(stats[card.key] ?? 0)}
          icon={card.icon}
          color={card.color}
          suffix={card.suffix}
          delay={index * 60}
        />
      ))}
    </section>
  );
}
