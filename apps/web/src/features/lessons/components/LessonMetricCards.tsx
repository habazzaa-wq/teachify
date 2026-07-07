"use client";

import { BookOpen, CheckCircle, FileEdit, Archive, Eye, Star, Clock } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { LessonMetricData } from "../types";

interface LessonMetricCardsProps {
  data?: LessonMetricData;
  loading?: boolean;
}

function LessonMetricCards({ data, loading }: LessonMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <AppMetricCard
        title="إجمالي الدروس"
        value={data?.totalLessons ?? 0}
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
        title="مؤرشف"
        value={data?.archived ?? 0}
        icon={Archive}
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
        title="مميز"
        value={data?.featured ?? 0}
        icon={Star}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="متوسط المدة"
        value={data?.avgDuration ?? 0}
        suffix=" د"
        icon={Clock}
        color="primary"
        loading={loading}
        delay={300}
      />
    </div>
  );
}

export { LessonMetricCards };
