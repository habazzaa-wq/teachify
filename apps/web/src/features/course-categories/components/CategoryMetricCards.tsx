"use client";

import { FolderOpen, Star, Eye, Archive, Plus } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { CategoryMetricData } from "../types";

interface CategoryMetricCardsProps {
  data?: CategoryMetricData;
  loading?: boolean;
}

function CategoryMetricCards({ data, loading }: CategoryMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <AppMetricCard
        title="إجمالي التصنيفات"
        value={data?.totalCategories ?? 0}
        icon={FolderOpen}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="نشط"
        value={data?.active ?? 0}
        icon={Eye}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="غير نشط"
        value={data?.inactive ?? 0}
        icon={Archive}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="مميز"
        value={data?.featured ?? 0}
        icon={Star}
        color="warning"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="الرئيسية"
        value={data?.parentCategories ?? 0}
        icon={FolderOpen}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="الفرعية"
        value={data?.childCategories ?? 0}
        icon={Plus}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="الدورات"
        value={data?.coursesCount ?? 0}
        icon={Eye}
        color="success"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="فارغة"
        value={data?.emptyCategories ?? 0}
        icon={Archive}
        color="destructive"
        loading={loading}
        delay={350}
      />
    </div>
  );
}

export { CategoryMetricCards };