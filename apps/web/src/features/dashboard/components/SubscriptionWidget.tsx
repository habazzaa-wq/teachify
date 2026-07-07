"use client";

import { AppWidget, AppBadge, AppProgress, AppButton } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";
import { useTenantStore } from "@/stores/tenant.store";
import { CreditCard, AlertTriangle, Crown } from "lucide-react";

export function SubscriptionWidget() {
  const sub = useSubscription();
  const tenant = useTenantStore((state) => state.activeTenant);

  return (
    <AppWidget title="حالة الاشتراك">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <span className="text-sm font-semibold">{sub.planName}</span>
          </div>
          <AppBadge
            variant={
              sub.isActive ? "success" :
              sub.isTrialing ? "warning" :
              "destructive"
            }
          >
            {sub.status}
          </AppBadge>
        </div>

        {sub.isTrialing && sub.daysRemaining > 0 && (
          <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>متبقي {sub.daysRemaining} يوم في الفترة التجريبية</span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">تقدم الاشتراك</span>
            <span className="font-medium">{sub.progress}%</span>
          </div>
          <AppProgress value={sub.progress} variant={sub.progress > 90 ? "warning" : "default"} />
        </div>

        <AppButton variant="outline" size="sm" className="w-full">
          <CreditCard className="h-4 w-4" />
          إدارة الفوترة
        </AppButton>
      </div>
    </AppWidget>
  );
}
