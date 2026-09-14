"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Download } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppButton,
  AppLoadingState,
  AppErrorState,
} from "@/components/ui";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useCurrentUser } from "@/hooks/useAuthStatus";
import { DashboardPeriodFilter } from "@/features/dashboard/components/DashboardPeriodFilter";
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { TopCoursesTable } from "@/features/dashboard/components/TopCoursesTable";
import { ExamPerformanceTable } from "@/features/dashboard/components/ExamPerformanceTable";
import { DashboardActivity } from "@/features/dashboard/components/DashboardActivity";
import { DashboardResources } from "@/features/dashboard/components/DashboardResources";
import { DashboardSummary } from "@/features/dashboard/components/DashboardSummary";
import { exportTeacherDashboardCsv } from "@/features/dashboard/export";
import type { DashboardQueryParams } from "@/features/dashboard/types";

function formatToday() {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function DashboardHomePage() {
  const [filters, setFilters] = useState<DashboardQueryParams>({
    period: "all",
  });
  const { data, isLoading, isError, refetch, isFetching } =
    useDashboardStats(filters);
  const { user } = useCurrentUser();

  if (isLoading && !data) {
    return (
      <AppLoadingState label="جارٍ تحميل لوحة التحكم..." className="min-h-[60vh]" />
    );
  }

  if (isError || !data) {
    return (
      <AppErrorState
        title="تعذّر تحميل لوحة التحكم"
        description="حدثت مشكلة أثناء جلب البيانات. حاول مرة أخرى."
        onRetry={() => void refetch()}
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <AppPage maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AppPageHeader
          title={`أهلًا ${user?.name ?? "أستاذي"} 👋`}
          description={`إليك ملخص منصتك — ${formatToday()}`}
          actions={
            <>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                loading={isFetching}
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => exportTeacherDashboardCsv(data)}
              >
                <Download className="h-4 w-4" />
                تصدير CSV
              </AppButton>
            </>
          }
        />
      </motion.div>

      <AppSection className="pt-0">
        <DashboardPeriodFilter
          value={filters}
          onChange={setFilters}
          disabled={isFetching}
        />
      </AppSection>

      <AppSection
        title="المؤشرات الرئيسية"
        description="قيم مقيَّدة بالفترة المحددة، مع المقارنة بالفترة السابقة"
      >
        <DashboardMetricCards summary={data.summary} />
      </AppSection>

      <AppSection
        title="التحليلات والاتجاهات"
        description="سلسلة زمنية كاملة داخل الفترة المحددة"
      >
        <DashboardCharts data={data} loading={isFetching} />
      </AppSection>

      <AppSection
        title="أداء الدورات والنشاط"
        description="أفضل الدورات وأحدث الأحداث على منصتك"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopCoursesTable courses={data.breakdowns.top_courses} />
          </div>
          <DashboardActivity items={data.recent_activity} />
        </div>
      </AppSection>

      <AppSection
        title="تفاصيل الامتحانات والموارد"
        description="تحليل أداء كل امتحان وحالة مصادر المنصة"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ExamPerformanceTable exams={data.breakdowns.exam_performance} />
          </div>
          <DashboardResources summary={data.summary} />
        </div>
      </AppSection>

      <AppSection
        title="المؤشرات الإجمالية"
        description="أرقام من عمر المنصة بالكامل"
      >
        <DashboardSummary summary={data.summary} />
      </AppSection>
    </AppPage>
  );
}

export default DashboardHomePage;