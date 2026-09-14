"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RefreshCw, Download, CalendarDays } from "lucide-react";
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
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { TopCoursesTable } from "@/features/dashboard/components/TopCoursesTable";
import { DashboardActivity } from "@/features/dashboard/components/DashboardActivity";
import { DashboardResources } from "@/features/dashboard/components/DashboardResources";
import { DashboardSummary } from "@/features/dashboard/components/DashboardSummary";

function formatToday() {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function DashboardHomePage() {
  const { data, isLoading, isError, refetch, isRefetching } =
    useDashboardStats();
  const { user } = useCurrentUser();

  if (isLoading) {
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

  const { stats } = data;

  return (
    <AppPage maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AppPageHeader
          title={`أهلًا ${user?.name ?? "أستاذي"} 👋`}
          description={`إليك ملخص منصتك اليوم — ${formatToday()}`}
          actions={
            <>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                loading={isRefetching}
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </AppButton>
              <AppButton variant="outline" size="sm">
                <Download className="h-4 w-4" />
                تصدير التقرير
              </AppButton>
            </>
          }
        />
      </motion.div>

      <AppSection>
        <DashboardMetricCards stats={stats} />
      </AppSection>

      <AppSection
        title="التحليلات والاتجاهات"
        description="حركة المنصة خلال آخر 12 شهرًا"
        actions={
          <AppButton
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            asChild
          >
            <Link href="/teacher/analytics">
              <CalendarDays className="h-3.5 w-3.5" />
              التحليلات المتقدمة
            </Link>
          </AppButton>
        }
      >
        <DashboardCharts data={data} />
      </AppSection>

      <AppSection
        title="أداء الدورات والنشاط"
        description="أفضل الدورات وأحدث الأحداث على منصتك"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopCoursesTable data={data} />
          </div>
          <DashboardActivity items={data.recent_activity} />
        </div>
      </AppSection>

      <AppSection
        title="ملخص إضافي"
        description="مؤشرات سريعة لتتبع نمو منصتك"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardSummary stats={stats} />
          </div>
          <DashboardResources stats={stats} />
        </div>
      </AppSection>
    </AppPage>
  );
}

export default DashboardHomePage;