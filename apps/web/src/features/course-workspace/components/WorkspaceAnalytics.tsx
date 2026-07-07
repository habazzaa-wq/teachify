"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, DollarSign, Eye, Clock, Star, GraduationCap } from "lucide-react";
import { AppMetricCard, AppChartCard, AppEmptyState, AppErrorState, AppLoadingState } from "@/components/ui";
import { useEnrollments } from "@/features/enrollments/hooks";
import type { Course } from "@/features/courses/types";

interface WorkspaceAnalyticsProps {
  course?: Course | null;
  courseId: string;
}

function WorkspaceAnalytics({ course, courseId }: WorkspaceAnalyticsProps) {
  const { data: enrollmentsData, isLoading, isError } = useEnrollments({ course_id: courseId, per_page: 100 });

  const metrics = useMemo(() => {
    if (!enrollmentsData?.data) return null;
    const enrollments = enrollmentsData.data;
    const total = enrollments.length;
    const completed = enrollments.filter((e) => e.status === "completed").length;
    const active = enrollments.filter((e) => e.status === "active").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    return {
      totalEnrollments: total,
      activeStudents: active,
      completionRate,
      avgProgress,
      completedCount: completed,
    };
  }, [enrollmentsData]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <AppMetricCard key={i} title="" value={0} icon={BarChart3} loading />
          ))}
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AppErrorState
          title="حدث خطأ"
          description="تعذّر تحميل التحليلات"
        />
      </motion.div>
    );
  }

  const m = metrics ?? { totalEnrollments: 0, activeStudents: 0, completionRate: 0, avgProgress: 0, completedCount: 0 };
  const hasData = m.totalEnrollments > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppMetricCard
          title="إجمالي المسجلين"
          value={m.totalEnrollments}
          icon={Users}
          color="primary"
        />
        <AppMetricCard
          title="الطلاب النشطون"
          value={m.activeStudents}
          icon={TrendingUp}
          color="success"
        />
        <AppMetricCard
          title="معدل الإكمال"
          value={m.completionRate}
          suffix="%"
          icon={BarChart3}
          color="warning"
        />
        <AppMetricCard
          title="معدل التقدم"
          value={m.avgProgress}
          suffix="%"
          icon={GraduationCap}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppChartCard
          title="الإيرادات"
          description="إجمالي الإيرادات من الدورة"
          empty={!hasData && !course?.price}
          emptyMessage="لا توجد بيانات إيرادات متاحة"
          chartHeight={200}
        >
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {course?.price ? `${course.price} ${course.currency ?? "SAR"}` : "0 SAR"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {m.totalEnrollments} تسجيل{m.totalEnrollments !== 1 ? "ات" : ""}
              </p>
            </div>
          </div>
        </AppChartCard>

        <AppChartCard
          title="إحصائيات عامة"
          description="مشاهدات ووقت المشاهدة"
          empty={!hasData}
          emptyMessage="لا توجد بيانات إحصائية متاحة"
          chartHeight={200}
        >
          <div className="flex items-center justify-center h-[200px] gap-8">
            <div className="text-center">
              <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground/60 mt-1">مشاهدات</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground/60 mt-1">وقت المشاهدة</p>
            </div>
          </div>
        </AppChartCard>
      </div>

      {hasData && (
        <AppChartCard
          title="آخر المسجلين"
          description="أحدث عمليات التسجيل في الدورة"
          chartHeight={200}
        >
          <div className="space-y-2">
            {enrollmentsData!.data.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm py-1.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {e.student.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{e.student.name}</span>
                <span className="text-xs text-muted-foreground/60">{e.status === "active" ? "نشط" : e.status === "completed" ? "مكتمل" : e.status}</span>
              </div>
            ))}
          </div>
        </AppChartCard>
      )}
    </motion.div>
  );
}

export { WorkspaceAnalytics };