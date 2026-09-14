"use client";

import type { ComponentType } from "react";
import {
  Users,
  Wallet,
  GraduationCap,
  CheckCircle2,
  ListChecks,
  Award,
  Ticket,
  Percent,
} from "lucide-react";
import { AppMetric } from "@/components/ui/AppMetric";
import type { DashboardSummary } from "../types";

interface DashboardSummaryProps {
  summary: DashboardSummary;
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const { students, enrollments, exams, revenue, certificates, recharge_codes, completions, media } =
    summary;

  const items: {
    label: string;
    value: number;
    suffix?: string;
    icon: ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    {
      label: "إجمالي الطلاب",
      value: students.total,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "إجمالي الإيرادات",
      value: Math.round(revenue.total),
      suffix: " ج.م",
      icon: Wallet,
      color: "text-success",
    },
    {
      label: "تسجيلات نشطة حاليًا",
      value: enrollments.active,
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      label: "دورات مكتملة كليًا",
      value: enrollments.completed,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "متوسط الإتمام",
      value: Math.round(completions.rate),
      suffix: "%",
      icon: Percent,
      color: "text-warning",
    },
    {
      label: "أسئلة الامتحانات",
      value: exams.questions,
      icon: ListChecks,
      color: "text-info",
    },
    {
      label: "إجمالي الشهادات",
      value: certificates.total,
      icon: Award,
      color: "text-info",
    },
    {
      label: "أكواد شحن مفعّلة",
      value: recharge_codes.active,
      icon: Ticket,
      color: "text-primary",
    },
    {
      label: "ملفات الوسائط",
      value: media.total,
      icon: GraduationCap,
      color: "text-info",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cnRow(index)}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <AppMetric
              label={item.label}
              value={item.value}
              suffix={item.suffix}
              icon={() => <Icon className={`h-4 w-4 ${item.color}`} />}
            />
          </div>
        );
      })}
    </div>
  );
}

function cnRow(index: number): string {
  const base =
    "rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30";
  return index % 2 === 0 ? `${base} animate-fade-in-up` : base;
}