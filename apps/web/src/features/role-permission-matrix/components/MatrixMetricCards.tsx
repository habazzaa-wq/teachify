"use client";

import { Shield, Key, CheckCheck, ShieldCheck, ShieldX, AlertTriangle, LayoutDashboard } from "lucide-react";
import { AppMetricCard } from "@/components/ui";

interface MatrixMetricCardsProps {
  data?: {
    totalRoles: number;
    totalPermissions: number;
    totalAssignments: number;
    rolesWithFullAccess: number;
    rolesWithNoAccess: number;
    highRiskAssignments: number;
    modulesCovered: number;
  };
  loading?: boolean;
}

function MatrixMetricCards({ data, loading }: MatrixMetricCardsProps) {
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
        title="إجمالي الصلاحيات"
        value={data?.totalPermissions ?? 0}
        icon={Key}
        color="info"
        loading={loading}
        delay={50}
      />
      <AppMetricCard
        title="إجمالي التعيينات"
        value={data?.totalAssignments ?? 0}
        icon={CheckCheck}
        color="success"
        loading={loading}
        delay={100}
      />
      <AppMetricCard
        title="الوصول الكامل"
        value={data?.rolesWithFullAccess ?? 0}
        icon={ShieldCheck}
        color="warning"
        loading={loading}
        delay={150}
      />
      <AppMetricCard
        title="بدون صلاحيات"
        value={data?.rolesWithNoAccess ?? 0}
        icon={ShieldX}
        color="destructive"
        loading={loading}
        delay={200}
      />
      <AppMetricCard
        title="صلاحيات عالية المخاطرة"
        value={data?.highRiskAssignments ?? 0}
        icon={AlertTriangle}
        color="destructive"
        loading={loading}
        delay={250}
      />
      <AppMetricCard
        title="الوحدات المغطاة"
        value={data?.modulesCovered ?? 0}
        icon={LayoutDashboard}
        color="primary"
        loading={loading}
        delay={300}
      />
    </div>
  );
}

export { MatrixMetricCards };
