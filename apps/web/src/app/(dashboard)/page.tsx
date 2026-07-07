"use client";

import { useDashboardStats } from "@/features/dashboard/hooks";
import { DashboardMetrics } from "@/features/dashboard/components/DashboardMetrics";
import { UsageWidgets } from "@/features/dashboard/components/UsageWidgets";
import { SubscriptionWidget } from "@/features/dashboard/components/SubscriptionWidget";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";
import { LatestNotifications } from "@/features/dashboard/components/LatestNotifications";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { AppPageHeader, AppWidget, AppEmptyState } from "@/components/ui";
import { useCurrentUser, useActiveTenant } from "@/hooks";
import { LayoutDashboard } from "lucide-react";

function DashboardHomePage() {
  const { user } = useCurrentUser();
  const { tenant } = useActiveTenant();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AppPageHeader
        title={`مرحباً${user?.name ? `، ${user.name}` : ""}`}
        description={tenant?.name ? `${tenant.name} — لوحة التحكم` : "لوحة التحكم"}
      />

      <DashboardMetrics />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UsageWidgets />

          <RecentActivity
            activities={[]}
            isLoading={isLoading}
          />
        </div>

        <div className="space-y-6">
          <SubscriptionWidget />

          <LatestNotifications
            notifications={[]}
            isLoading={isLoading}
          />

          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default DashboardHomePage;
