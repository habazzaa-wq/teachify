"use client";

import { Shield, ShieldCheck, ShieldBan, Archive, Settings, UserPlus, Users, Key } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { TenantRoleMetricData } from "../types";

interface TenantRoleMetricCardsProps {
  data?: TenantRoleMetricData;
  loading?: boolean;
}

function TenantRoleMetricCards({ data, loading }: TenantRoleMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <AppMetricCard
        title="إجمالي الأدوار"
        value={data?.totalRoles ?? 0}
        icon={Shield}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="نشط"
        value={data?.activeRoles ?? 0}
        icon={ShieldCheck}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="غير نشط"
        value={data?.inactiveRoles ?? 0}
        icon={ShieldBan}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="مؤرشف"
        value={data?.archivedRoles ?? 0}
        icon={Archive}
        color="destructive"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="أدوار النظام"
        value={data?.systemRoles ?? 0}
        icon={Settings}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="أدوار مخصصة"
        value={data?.customRoles ?? 0}
        icon={UserPlus}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="إجمالي المستخدمين"
        value={data?.totalUsersInRoles ?? 0}
        icon={Users}
        color="success"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="إجمالي الصلاحيات"
        value={data?.totalPermissions ?? 0}
        icon={Key}
        color="warning"
        loading={loading}
        delay={350}
      />
    </div>
  );
}

export { TenantRoleMetricCards };
