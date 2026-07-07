"use client";

import { AppPageHeader, AppWidget, AppEmptyState, AppButton } from "@/components/ui";
import { BarChart3, RefreshCw } from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { UsageWidgets } from "@/features/dashboard/components/UsageWidgets";

function AnalyticsPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AppPageHeader
        title="التحليلات"
        description="إحصائيات وتحليلات شاملة لأداء المنصة"
      />

      <UsageWidgets />

      <div className="grid gap-6 md:grid-cols-2">
        <AppWidget
          title="نظرة عامة"
          loading={isLoading}
          error={isError}
          onRetry={() => refetch()}
        >
          <AppEmptyState
            icon={BarChart3}
            title="التحليلات قريباً"
            description="ستظهر هنا الرسوم البيانية وتحليلات الأداء التفصيلية"
            action={
              <AppButton variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث
              </AppButton>
            }
          />
        </AppWidget>

        <AppWidget title="التقارير" loading={isLoading}>
          <AppEmptyState
            icon={BarChart3}
            title="لا توجد تقارير بعد"
            description="قم بإنشاء تقارير مخصصة لتحليل بيانات المنصة"
            variant="compact"
          />
        </AppWidget>
      </div>
    </div>
  );
}

export default AnalyticsPage;
