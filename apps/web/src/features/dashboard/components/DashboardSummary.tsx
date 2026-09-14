"use client";

import {
  GraduationCap,
  CheckCircle2,
  ListChecks,
  Ticket,
  Percent,
  Video,
} from "lucide-react";
import { AppMetric } from "@/components/ui/AppMetric";
import type { DashboardStats } from "../types";

interface DashboardSummaryProps {
  stats: DashboardStats;
}

const items = [
  { key: "enrollments_active" as const, label: "تسجيلات نشطة", icon: GraduationCap, color: "text-primary" },
  { key: "enrollments_completed" as const, label: "دورات مكتملة", icon: CheckCircle2, color: "text-success" },
  { key: "average_completion_rate" as const, label: "متوسط الإتمام", icon: Percent, color: "text-warning", suffix: "%" },
  { key: "questions_total" as const, label: "أسئلة الامتحانات", icon: ListChecks, color: "text-info" },
  { key: "recharge_codes_active" as const, label: "أكواد شحن مفعّلة", icon: Ticket, color: "text-primary" },
  { key: "media_videos" as const, label: "فيديوهات تعليمية", icon: Video, color: "text-info" },
];

export function DashboardSummary({ stats }: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];
        const display =
          item.key === "average_completion_rate"
            ? Math.round(value)
            : value;

        return (
          <div
            key={item.key}
            className={
              "rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 " +
              (index % 2 === 0 ? "animate-fade-in-up" : "")
            }
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <AppMetric
              label={item.label}
              value={display}
              suffix={item.suffix}
              icon={() => <Icon className={`h-4 w-4 ${item.color}`} />}
            />
          </div>
        );
      })}
    </div>
  );
}