"use client";

import { Globe, CheckCircle, Clock, ShieldAlert, ShieldX, Ban } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { DomainDashboardMetrics } from "../hooks";

interface DomainMetricCardsProps {
  metrics: DomainDashboardMetrics;
  loading?: boolean;
}

function DomainMetricCards({ metrics, loading }: DomainMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AppMetricCard
        title="إجمالي النطاقات"
        value={metrics.total}
        icon={Globe}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="النطاقات النشطة"
        value={metrics.active}
        icon={CheckCircle}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="بانتظار DNS"
        value={metrics.pendingDns}
        icon={Clock}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="SSL قيد الإصدار"
        value={metrics.sslIssuing}
        icon={ShieldAlert}
        color="warning"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="أخطاء SSL"
        value={metrics.sslErrors}
        icon={ShieldX}
        color="destructive"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="موقوفة"
        value={metrics.suspended}
        icon={Ban}
        color="info"
        loading={loading}
        delay={250}
      />
    </div>
  );
}

export { DomainMetricCards };
