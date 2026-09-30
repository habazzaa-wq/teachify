"use client";

import {
  UserPlus,
  Wallet,
  GraduationCap,
  ClipboardList,
  Target,
  Gauge,
  Award,
  CheckCircle2,
} from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { DashboardSummary } from "../types";

interface DashboardMetricCardsProps {
  summary: DashboardSummary;
}

export function DashboardMetricCards({ summary }: DashboardMetricCardsProps) {
  const { students, enrollments, exams, revenue, certificates, completions } =
    summary;

  return (
    <section aria-label="المؤشرات الرئيسية" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppMetricCard
          title="طلاب جدد خلال الفترة"
          value={students.new_period}
          icon={UserPlus}
          color="primary"
          trend={{
            value: Math.abs(students.change_percent),
            positive: students.change_percent >= 0,
          }}
          delay={0}
        />
        <AppMetricCard
          title="الإيرادات خلال الفترة"
          value={Math.round(revenue.period)}
          icon={Wallet}
          color="success"
          suffix=" ج.م"
          trend={{
            value: Math.abs(revenue.change_percent),
            positive: revenue.change_percent >= 0,
          }}
          delay={60}
        />
        <AppMetricCard
          title="تسجيلات جديدة في الدورات"
          value={enrollments.new_period}
          icon={GraduationCap}
          color="info"
          trend={{
            value: Math.abs(enrollments.change_percent),
            positive: enrollments.change_percent >= 0,
          }}
          delay={120}
        />
        <AppMetricCard
          title="محاولات امتحانات (مُسلَّمة)"
          value={exams.attempts_period}
          icon={ClipboardList}
          color="warning"
          trend={{
            value: Math.abs(exams.change_percent),
            positive: exams.change_percent >= 0,
          }}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppMetricCard
          title="نسبة النجاح خلال الفترة"
          value={exams.pass_rate_period}
          icon={Target}
          color="primary"
          suffix="%"
          delay={0}
        />
        <AppMetricCard
          title="متوسط الدرجات خلال الفترة"
          value={exams.avg_score_period}
          icon={Gauge}
          color="warning"
          suffix="%"
          delay={60}
        />
        <AppMetricCard
          title="شهادات صادرة خلال الفترة"
          value={certificates.issued_period}
          icon={Award}
          color="info"
          trend={{
            value: Math.abs(certificates.change_percent),
            positive: certificates.change_percent >= 0,
          }}
          delay={120}
        />
        <AppMetricCard
          title="دورات مكتملة خلال الفترة"
          value={completions.period}
          icon={CheckCircle2}
          color="success"
          trend={{
            value: Math.abs(completions.change_percent),
            positive: completions.change_percent >= 0,
          }}
          delay={180}
        />
      </div>
    </section>
  );
}