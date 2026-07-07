"use client";

import { Building2, CheckCircle, Clock, FlaskConical, Users, HardDrive, Video, DollarSign } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { TenantsMetricData } from "../types";

interface TenantMetricCardsProps {
  data?: TenantsMetricData;
  loading?: boolean;
}

function TenantMetricCards({ data, loading }: TenantMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppMetricCard
        title="عدد المؤسسات"
        value={data?.totalTenants ?? 0}
        icon={Building2}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="المؤسسات النشطة"
        value={data?.activeTenants ?? 0}
        icon={CheckCircle}
        color="success"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="المؤسسات المعلقة"
        value={data?.pendingTenants ?? 0}
        icon={Clock}
        color="warning"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="المؤسسات التجريبية"
        value={data?.trialTenants ?? 0}
        icon={FlaskConical}
        color="info"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="عدد المستخدمين"
        value={data?.totalUsers ?? 0}
        icon={Users}
        color="primary"
        loading={loading}
        delay={400}
      />
      <AppMetricCard
        title="إجمالي المساحة المستخدمة"
        value={data?.totalStorageUsed ?? 0}
        suffix=" GB"
        icon={HardDrive}
        color="info"
        loading={loading}
        delay={500}
      />
      <AppMetricCard
        title="إجمالي الفيديوهات"
        value={data?.totalVideos ?? 0}
        icon={Video}
        color="success"
        loading={loading}
        delay={600}
      />
      <AppMetricCard
        title="إجمالي الإيرادات الشهرية"
        value={data?.monthlyRevenue ?? 0}
        prefix="$"
        icon={DollarSign}
        color="warning"
        loading={loading}
        delay={700}
      />
    </div>
  );
}

export { TenantMetricCards };
