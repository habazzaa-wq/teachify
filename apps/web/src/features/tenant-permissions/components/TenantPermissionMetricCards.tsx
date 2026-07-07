"use client";

import { Shield, ShieldCheck, ShieldBan, Archive, Settings, UserPlus, Users, LayoutDashboard } from "lucide-react";
import { AppMetricCard } from "@/components/ui";
import type { TenantPermissionMetricData } from "../types";

interface TenantPermissionMetricCardsProps {
  data?: TenantPermissionMetricData;
  loading?: boolean;
}

function TenantPermissionMetricCards({ data, loading }: TenantPermissionMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <AppMetricCard
        title="إجمالي الصلاحيات"
        value={data?.totalPermissions ?? 0}
        icon={Shield}
        color="primary"
        loading={loading}
        delay={0}
      />
      <AppMetricCard
        title="نشط"
        value={data?.activePermissions ?? 0}
        icon={ShieldCheck}
        color="success"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="غير نشط"
        value={data?.inactivePermissions ?? 0}
        icon={ShieldBan}
        color="warning"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="مؤرشف"
        value={data?.archivedPermissions ?? 0}
        icon={Archive}
        color="destructive"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="صلاحيات النظام"
        value={data?.systemPermissions ?? 0}
        icon={Settings}
        color="info"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="صلاحيات مخصصة"
        value={data?.customPermissions ?? 0}
        icon={UserPlus}
        color="primary"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="إجمالي استخدام الأدوار"
        value={data?.totalRolesUsingPermissions ?? 0}
        icon={Users}
        color="success"
        loading={loading}
        delay={300}
      />
      <AppMetricCard
        title="الوحدات المغطاة"
        value={data?.modulesCovered ?? 0}
        icon={LayoutDashboard}
        color="warning"
        loading={loading}
        delay={350}
      />
    </div>
  );
}

export { TenantPermissionMetricCards };
