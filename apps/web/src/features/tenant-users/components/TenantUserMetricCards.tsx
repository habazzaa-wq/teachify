"use client";

import { Users, UserCheck, UserX, Ban, ShieldCheck, UserPlus, Building2, Mail } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { TenantUserMetricData } from "../types";

interface TenantUserMetricCardsProps {
  data?: TenantUserMetricData;
  loading?: boolean;
}

function TenantUserMetricCards({ data, loading }: TenantUserMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <AppMetricCard
        title="إجمالي المستخدمين"
        value={data?.totalUsers ?? 0}
        icon={Users}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="نشط"
        value={data?.activeUsers ?? 0}
        icon={UserCheck}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="غير نشط"
        value={data?.inactiveUsers ?? 0}
        icon={UserX}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="موقوف"
        value={data?.suspendedUsers ?? 0}
        icon={Ban}
        color="destructive"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="2FA مفعل"
        value={data?.twoFactorEnabled ?? 0}
        icon={ShieldCheck}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="جدد هذا الشهر"
        value={data?.newThisMonth ?? 0}
        icon={UserPlus}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="الأقسام"
        value={data?.departmentCount ?? 0}
        icon={Building2}
        color="success"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="دعوات معلقة"
        value={data?.pendingInvites ?? 0}
        icon={Mail}
        color="warning"
        loading={loading}
        delay={350}
      />
    </div>
  );
}

export { TenantUserMetricCards };
