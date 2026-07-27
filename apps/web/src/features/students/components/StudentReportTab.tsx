"use client";

import { TrendingUp, Award, BarChart3, Clock, Target, Zap, BookOpen } from "lucide-react";
import { AppProgress, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useStudentAnalytics } from "@/features/students/hooks";

interface StudentReportTabProps {
  studentId: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color] ?? colorMap.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground mr-1">{suffix}</span>}
      </div>
    </div>
  );
}

function ScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{score.toFixed(1)}{maxScore === 100 ? "%" : `/ ${maxScore}`}</span>
      </div>
      <AppProgress value={percent} className="h-2" />
    </div>
  );
}

function StudentReportTab({ studentId }: StudentReportTabProps) {
  const { data: analytics, isLoading } = useStudentAnalytics(studentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          نظرة عامة على التقدم
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="الكورسات المسجلة" value={analytics?.totalEnrolledCourses ?? 0} color="primary" />
          <StatCard icon={Award} label="الكورسات المكتملة" value={analytics?.completedCourses ?? 0} color="success" />
          <StatCard icon={TrendingUp} label="متوسط التقدم" value={`${analytics?.averageProgress ?? 0}%`} color="info" />
          <StatCard icon={Target} label="الشهادات" value={analytics?.certificatesEarned ?? 0} color="warning" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          الدرجات والأداء
        </h3>
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <ScoreBar label="متوسط درجة الكويزات" score={analytics?.averageQuizScore ?? 0} />
          <ScoreBar label="متوسط درجة الواجبات" score={analytics?.averageAssignmentScore ?? 0} />
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">محاولات الكويزات</span>
              <span className="font-semibold tabular-nums">{analytics?.totalQuizAttempts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground"> تسليمات الواجبات</span>
              <span className="font-semibold tabular-nums">{analytics?.totalAssignmentSubmissions ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          النشاط
        </h3>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">آخر نشاط مسجل</span>
            <span className="text-sm font-medium tabular-nums">
              {analytics?.lastActivityAt ? formatDateTime(analytics.lastActivityAt) : "لا يوجد نشاط"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { StudentReportTab };
