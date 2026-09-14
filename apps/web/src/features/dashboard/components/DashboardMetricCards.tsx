"use client";

import {
  Users,
  BookOpen,
  ClipboardList,
  Wallet,
  UserCheck,
  Target,
  Gauge,
  Award,
} from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { DashboardStats } from "../types";

interface DashboardMetricCardsProps {
  stats: DashboardStats;
}

export function DashboardMetricCards({ stats }: DashboardMetricCardsProps) {
  const revenuePositive = stats.revenue_trend >= 0;

  return (
    <section aria-label="المؤشرات الرئيسية" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppMetricCard
          title="إجمالي الطلاب"
          value={stats.students_total}
          icon={Users}
          color="primary"
          trend={{ value: Math.abs(stats.students_trend), positive: stats.students_trend >= 0 }}
          delay={0}
        />
        <AppMetricCard
          title="الدورات"
          value={stats.courses_total}
          icon={BookOpen}
          color="info"
          trend={{ value: Math.abs(stats.courses_trend), positive: stats.courses_trend >= 0 }}
          delay={60}
        />
        <AppMetricCard
          title="الامتحانات"
          value={stats.exams_total}
          icon={ClipboardList}
          color="warning"
          trend={{ value: Math.abs(stats.exams_trend), positive: stats.exams_trend >= 0 }}
          delay={120}
        />
        <AppMetricCard
          title="إجمالي الإيرادات"
          value={Math.round(stats.revenue_total)}
          icon={Wallet}
          color="success"
          suffix=" ج.م"
          trend={{ value: Math.abs(stats.revenue_trend), positive: revenuePositive }}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppMetricCard
          title="الطلاب النشطون"
          value={stats.students_active}
          icon={UserCheck}
          color="success"
          delay={0}
        />
        <AppMetricCard
          title="نسبة النجاح في الامتحانات"
          value={stats.attempts_pass_rate}
          icon={Target}
          color="primary"
          suffix="%"
          delay={60}
        />
        <AppMetricCard
          title="متوسط درجات الطلاب"
          value={stats.attempts_average_score}
          icon={Gauge}
          color="warning"
          suffix="%"
          delay={120}
        />
        <AppMetricCard
          title="الشهادات الصادرة"
          value={stats.certificates_total}
          icon={Award}
          color="info"
          trend={{ value: Math.abs(stats.certificates_trend), positive: stats.certificates_trend >= 0 }}
          delay={180}
        />
      </div>
    </section>
  );
}