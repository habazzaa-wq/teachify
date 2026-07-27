"use client";

import { Users, UserCheck, GraduationCap, UserPlus, TrendingUp, Award } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { StudentMetrics } from "../types";

interface StudentMetricCardsProps {
  data?: StudentMetrics;
  loading?: boolean;
}

function StudentMetricCards({ data, loading }: StudentMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AppMetricCard
        title="إجمالي الطلاب"
        value={data?.totalStudents ?? 0}
        icon={Users}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="الطلاب النشطين"
        value={data?.activeStudents ?? 0}
        icon={UserCheck}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="مسجلين في كورسات"
        value={data?.enrolledStudents ?? 0}
        icon={GraduationCap}
        color="info"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="جدد هذا الشهر"
        value={data?.newThisMonth ?? 0}
        icon={UserPlus}
        color="primary"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="متوسط التقدم"
        value={data?.averageProgress ?? 0}
        suffix="%"
        icon={TrendingUp}
        color="warning"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="نسبة الإتمام"
        value={data?.completionRate ?? 0}
        suffix="%"
        icon={Award}
        color="success"
        loading={loading}
        delay={250}
      />
    </div>
  );
}

export { StudentMetricCards };
