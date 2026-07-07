"use client";

import { Package, CheckCircle, FlaskConical, Star, DollarSign, Infinity } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { PlansMetricData } from "../types";

interface PlanMetricCardsProps {
  data?: PlansMetricData;
  loading?: boolean;
}

function PlanMetricCards({ data, loading }: PlanMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AppMetricCard
        title="إجمالي الباقات"
        value={data?.totalPlans ?? 0}
        icon={Package}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="الباقات النشطة"
        value={data?.activePlans ?? 0}
        icon={CheckCircle}
        color="success"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="الباقات التجريبية"
        value={data?.trialPlans ?? 0}
        icon={FlaskConical}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="الباقات المميزة"
        value={data?.featuredPlans ?? 0}
        icon={Star}
        color="warning"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="متوسط السعر الشهري"
        value={data?.averageMonthlyPrice ?? 0}
        prefix="$"
        icon={DollarSign}
        color="primary"
        loading={loading}
        delay={400}
      />
      <AppMetricCard
        title="الباقات غير المحدودة"
        value={data?.unlimitedPlans ?? 0}
        icon={Infinity}
        color="destructive"
        loading={loading}
        delay={500}
      />
    </div>
  );
}

export { PlanMetricCards };
