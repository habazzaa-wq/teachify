"use client";

import { TrendingUp, Users, GraduationCap } from "lucide-react";
import { AppChartCard, AppBadge } from "@/components/ui";
import { AreaChart, DonutChart } from "@/components/dashboard";
import type { TeacherDashboardData } from "../types";
import { formatCurrency } from "@/lib/format";

interface DashboardChartsProps {
  data: TeacherDashboardData;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { stats, revenue_trend, students_trend, enrollment_trend } = data;

  const totalAttempts = Math.max(stats.attempts_total, 1);
  const passed = Math.min(stats.attempts_passed, totalAttempts);
  const failed = Math.max(0, stats.attempts_submitted - passed);
  const inProgress = Math.max(0, totalAttempts - stats.attempts_submitted);

  const examDonut = [
    { label: "نجح", value: passed, color: "hsl(var(--success))" },
    { label: "لم يجتز", value: failed, color: "hsl(var(--destructive))" },
    { label: "لم يُسلَّم", value: inProgress, color: "hsl(var(--warning))" },
  ].filter((s) => s.value > 0);

  return (
    <section aria-label="الرسوم البيانية" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <AppChartCard
          className="lg:col-span-2"
          title="الإيرادات خلال 12 شهر"
          description="إجمالي عمليات شراء الدورات مقابل شهريًا"
          badge={
            <AppBadge
              variant={stats.revenue_trend >= 0 ? "success" : "destructive"}
              className="gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              {stats.revenue_trend >= 0 ? "+" : ""}
              {stats.revenue_trend}%
            </AppBadge>
          }
          chartHeight={230}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {formatCurrency(stats.revenue_total)}
              </span>
              <span className="ms-2 text-sm text-muted-foreground">
                إجمالي الإيرادات
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                هذا الشهر: {formatCurrency(stats.revenue_month)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                اليوم: {formatCurrency(stats.revenue_today)}
              </div>
            </div>
          </div>
          <div className="h-[200px]">
            {revenue_trend.length > 1 ? (
              <AreaChart
                data={revenue_trend}
                height={200}
                color="hsl(var(--success))"
                gradient={{ from: "hsl(var(--success))", to: "hsl(var(--success))" }}
                showGrid
                showLabels
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                لا توجد بيانات كافية بعد
              </p>
            )}
          </div>
        </AppChartCard>

        {/* Exam performance donut */}
        <AppChartCard
          title="أداء الامتحانات"
          description={`نسبة النجاح ${stats.attempts_pass_rate}% من ${stats.attempts_submitted} محاولة `}
        >
          <div className="flex h-[240px] flex-col justify-center">
            <DonutChart segments={examDonut} size={170} strokeWidth={20} />
          </div>
        </AppChartCard>
      </div>

      {/* Growth trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AppChartCard
          title="نمو الطلاب"
          description="الطلاب الجدد شهريًا خلال آخر 12 شهر"
          badge={
            <AppBadge
              variant="secondary"
              className="gap-1"
            >
              <Users className="h-3 w-3" />
              {stats.students_new_month} هذا الشهر
            </AppBadge>
          }
          chartHeight={170}
        >
          <div className="h-[150px]">
            {students_trend.length > 1 ? (
              <AreaChart
                data={students_trend}
                height={150}
                color="hsl(var(--primary))"
                gradient={{ from: "hsl(var(--primary))", to: "hsl(var(--primary))" }}
                showGrid
                showLabels
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                لا توجد بيانات كافية بعد
              </p>
            )}
          </div>
        </AppChartCard>

        <AppChartCard
          title="التسجيلات في الدورات"
          description="عمليات التسجيل الشهرية خلال آخر 12 شهر"
          badge={
            <AppBadge
              variant={stats.enrollments_trend >= 0 ? "success" : "destructive"}
              className="gap-1"
            >
              <GraduationCap className="h-3 w-3" />
              {stats.enrollments_trend >= 0 ? "+" : ""}
              {stats.enrollments_trend}%
            </AppBadge>
          }
          chartHeight={170}
        >
          <div className="h-[150px]">
            {enrollment_trend.length > 1 ? (
              <AreaChart
                data={enrollment_trend}
                height={150}
                color="hsl(var(--chart-4))"
                gradient={{ from: "hsl(var(--chart-4))", to: "hsl(var(--chart-4))" }}
                showGrid
                showLabels
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                لا توجد بيانات كافية بعد
              </p>
            )}
          </div>
        </AppChartCard>
      </div>
    </section>
  );
}