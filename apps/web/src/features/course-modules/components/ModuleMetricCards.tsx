"use client";

import { BookOpen, FileEdit, Star, Clock, Layers } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { ModuleMetricData } from "../types";

interface ModuleMetricCardsProps {
  data?: ModuleMetricData;
  loading?: boolean;
}

function ModuleMetricCards({ data, loading }: ModuleMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AppMetricCard
        title="إجمالي الوحدات"
        value={data?.totalModules ?? 0}
        icon={BookOpen}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="منشور"
        value={data?.published ?? 0}
        icon={BookOpen}
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
        title="مميز"
        value={data?.featured ?? 0}
        icon={Star}
        color="primary"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="متوسط المدة"
        value={data?.avgDuration ?? 0}
        suffix=" د"
        icon={Clock}
        color="primary"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="إجمالي الأقسام"
        value={data?.totalSections ?? 0}
        icon={Layers}
        color="primary"
        loading={loading}
        delay={250}
      />
    </div>
  );
}

export { ModuleMetricCards };
