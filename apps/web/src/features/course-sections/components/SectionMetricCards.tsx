"use client";

import { BookOpen, CheckCircle, FileEdit, Lock, Eye, Clock, Layers } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { SectionMetricData } from "../types";

interface SectionMetricCardsProps {
  data?: SectionMetricData;
  loading?: boolean;
}

function SectionMetricCards({ data, loading }: SectionMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <AppMetricCard
        title="إجمالي الأقسام"
        value={data?.totalSections ?? 0}
        icon={BookOpen}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="منشور"
        value={data?.published ?? 0}
        icon={CheckCircle}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="مسودة"
        value={data?.draft ?? 0}
        icon={FileEdit}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="مقفل"
        value={data?.locked ?? 0}
        icon={Lock}
        color="destructive"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="معاينة مجانية"
        value={data?.freePreview ?? 0}
        icon={Eye}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="متوسط المدة"
        value={data?.avgDuration ?? 0}
        suffix=" د"
        icon={Clock}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="إجمالي الدروس"
        value={data?.totalLessons ?? 0}
        icon={Layers}
        color="primary"
        loading={loading}
        delay={300}
      />
    </div>
  );
}

export { SectionMetricCards };
