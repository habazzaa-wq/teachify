"use client";

import {
  TrendingUp,
  Users,
  GraduationCap,
  ClipboardList,
  Target,
  Award,
  CheckCircle2,
} from "lucide-react";
import { AppChartCard, AppBadge } from "@/components/ui";
import { AreaChart, DonutChart } from "@/components/dashboard";
import type { TeacherDashboardData } from "../types";
import { formatCurrency, formatNumber } from "@/lib/format";

interface DashboardChartsProps {
  data: TeacherDashboardData;
  loading?: boolean;
}

export function DashboardCharts({ data, loading }: DashboardChartsProps) {
  const { summary, trends, filters } = data;
  const unit = filters.bucket_label;
  const granularityNote = `التوزيع ${unit} داخل الفترة المحددة`;

  const submitted = Math.max(summary.exams.attempts_period, 0);
  const passed = Math.min(summary.exams.passed_period, submitted);
  const failed = Math.max(0, submitted - passed);
  const notSubmitted = Math.max(0, summary.exams.attempts_total - summary.exams.attempts_submitted);

  const examDonut = [
    { label: "نجح", value: passed, color: "hsl(var(--success))" },
    { label: "لم يجتز", value: failed, color: "hsl(var(--destructive))" },
    { label: "لم يُسلَّم", value: notSubmitted, color: "hsl(var(--warning))" },
  ].filter((s) => s.value > 0);

  return (
    <section aria-label="الرسوم البيانية" className="space-y-6">
      {/* Revenue + exam donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AppChartCard
          className="lg:col-span-2"
          title="الإيرادات"
          description={granularityNote}
          badge={
            <AppBadge
              variant={summary.revenue.change_percent >= 0 ? "success" : "destructive"}
              className="gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              {summary.revenue.change_percent >= 0 ? "+" : ""}
              {summary.revenue.change_percent}%
            </AppBadge>
          }
          chartHeight={230}
          loading={loading}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {formatCurrency(summary.revenue.period)}
              </span>
              <span className="ms-2 text-sm text-muted-foreground">
                إيرادات الفترة
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                اليوم: {formatCurrency(summary.revenue.today)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                المتوسط/يوم: {formatCurrency(summary.revenue.avg_per_day)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" />
                معاملات: {formatNumber(summary.revenue.transactions_period)}
              </div>
            </div>
          </div>
          <div className="h-[200px]">
            {trends.revenue.length > 1 ? (
              <AreaChart
                data={trends.revenue}
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

        <AppChartCard
          title="أداء الامتحانات"
          description={`${formatNumber(summary.exams.attempts_period)} محاولة في الفترة · نسبة النجاح ${summary.exams.pass_rate_period}%`}
          loading={loading}
        >
          <div className="flex h-[250px] flex-col items-center justify-center">
            <DonutChart segments={examDonut} size={170} strokeWidth={20} />
            <p className="mt-3 text-xs text-muted-foreground">
              إجمالي المحاولات الكلي: {formatNumber(summary.exams.attempts_total)}
            </p>
          </div>
        </AppChartCard>
      </div>

      {/* Growth trio */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AppChartCard
          title="نمو الطلاب"
          description={granularityNote}
          badge={
            <AppBadge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(summary.students.new_period)} طالب جديد
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.students_new.length > 1 ? (
              <AreaChart
                data={trends.students_new}
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
          description={granularityNote}
          badge={
            <AppBadge
              variant={summary.enrollments.change_percent >= 0 ? "success" : "destructive"}
              className="gap-1"
            >
              <GraduationCap className="h-3 w-3" />
              {summary.enrollments.change_percent >= 0 ? "+" : ""}
              {summary.enrollments.change_percent}%
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.enrollments.length > 1 ? (
              <AreaChart
                data={trends.enrollments}
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

        <AppChartCard
          title="محاولات الامتحانات"
          description={granularityNote}
          badge={
            <AppBadge variant="secondary" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              {formatNumber(summary.exams.attempts_period)} محاولة
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.exam_attempts.length > 1 ? (
              <AreaChart
                data={trends.exam_attempts}
                height={150}
                color="hsl(var(--warning))"
                gradient={{ from: "hsl(var(--warning))", to: "hsl(var(--warning))" }}
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

      {/* Quality trio */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AppChartCard
          title="نسبة النجاح"
          description="نسبة المحاولات الناجحة لكل فترة ضمن النطاق"
          badge={
            <AppBadge
              variant={summary.exams.pass_rate_period >= 50 ? "success" : "warning"}
              className="gap-1"
            >
              <Target className="h-3 w-3" />
              {summary.exams.pass_rate_period}%
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.exam_pass_rate.length > 1 ? (
              <AreaChart
                data={trends.exam_pass_rate}
                height={150}
                color="hsl(var(--chart-5))"
                gradient={{ from: "hsl(var(--chart-5))", to: "hsl(var(--chart-5))" }}
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
          title="الشهادات الصادرة"
          description={granularityNote}
          badge={
            <AppBadge
              variant={summary.certificates.change_percent >= 0 ? "success" : "destructive"}
              className="gap-1"
            >
              <Award className="h-3 w-3" />
              {Math.abs(summary.certificates.change_percent)}%
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.certificates.length > 1 ? (
              <AreaChart
                data={trends.certificates}
                height={150}
                color="hsl(var(--chart-3))"
                gradient={{ from: "hsl(var(--chart-3))", to: "hsl(var(--chart-3))" }}
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
          title="إتمام الدورات"
          description={`${summary.completions.period} إتمام ضمن الفترة`}
          badge={
            <AppBadge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              المعدل الكلي {summary.completions.rate}%
            </AppBadge>
          }
          chartHeight={170}
          loading={loading}
        >
          <div className="h-[150px]">
            {trends.completions.length > 1 ? (
              <AreaChart
                data={trends.completions}
                height={150}
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
      </div>
    </section>
  );
}