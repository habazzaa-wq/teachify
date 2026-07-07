"use client";

import { Globe, CheckCircle, Clock, ShieldAlert, HeartPulse, XCircle, Gauge } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { DomainsMetricData } from "../types";

interface DomainMetricCardsProps {
  data?: DomainsMetricData;
  loading?: boolean;
}

function DomainMetricCards({ data, loading }: DomainMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
      <AppMetricCard
        title="إجمالي النطاقات"
        value={data?.totalDomains ?? 0}
        icon={Globe}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="النطاقات الأساسية"
        value={data?.primaryDomains ?? 0}
        icon={CheckCircle}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="بانتظار التحقق"
        value={data?.pendingVerification ?? 0}
        icon={Clock}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="SSL وشيك الانتهاء"
        value={data?.sslExpiringSoon ?? 0}
        icon={ShieldAlert}
        color="destructive"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="نطاقات سليمة"
        value={data?.healthyDomains ?? 0}
        icon={HeartPulse}
        color="success"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="نطاقات فاشلة"
        value={data?.failedDomains ?? 0}
        icon={XCircle}
        color="destructive"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="متوسط زمن الاستجابة"
        value={data?.averageResponseTime ?? 0}
        suffix=" ms"
        icon={Gauge}
        color="info"
        loading={loading}
        delay={300}
      />
    </div>
  );
}

export { DomainMetricCards };
