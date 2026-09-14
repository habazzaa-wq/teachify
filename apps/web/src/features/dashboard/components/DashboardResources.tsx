"use client";

import { HardDrive, CalendarCheck, PlaySquare, Files } from "lucide-react";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppBadge,
  AppProgress,
} from "@/components/ui";
import type { DashboardStats } from "../types";
import { formatBytes } from "@/lib/format";

interface DashboardResourcesProps {
  stats: DashboardStats;
}

export function DashboardResources({ stats }: DashboardResourcesProps) {
  const { storage, subscription } = stats;
  const tierVariant =
    subscription.status === "active"
      ? "success"
      : subscription.status === "trial"
        ? "warning"
        : "secondary";

  return (
    <AppCard className="card-elevated h-full">
      <AppCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <AppCardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5 text-primary" />
            الموارد والاشتراك
          </AppCardTitle>
          <AppBadge variant={tierVariant} className="capitalize">
            {subscription.status}
          </AppBadge>
        </div>
      </AppCardHeader>
      <AppCardContent className="space-y-6">
        {/* Storage */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/80">
              مساحة التخزين
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatBytes(storage.used)} / {formatBytes(storage.total)}
            </span>
          </div>
          <AppProgress
            value={storage.usage_percent}
            variant={
              storage.usage_percent > 80
                ? "destructive"
                : storage.usage_percent > 60
                  ? "warning"
                  : "default"
            }
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {storage.usage_percent}% مستخدم · {formatBytes(storage.remaining)} متبقي
          </p>
        </div>

        {/* Subscription */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <CalendarCheck className="h-4 w-4 text-primary" />
              خطة {subscription.plan}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {subscription.days_left} يوم متبقٍ
            </span>
          </div>
          <AppProgress value={subscription.progress} variant="success" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {subscription.progress}% من مدة الاشتراك منقضية
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-5">
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Files className="h-3.5 w-3.5" />
              ملفات الوسائط
            </div>
            <p className="text-xl font-bold tabular-nums">{stats.media_total}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <PlaySquare className="h-3.5 w-3.5" />
              فيديوهات
            </div>
            <p className="text-xl font-bold tabular-nums">{stats.media_videos}</p>
          </div>
        </div>
      </AppCardContent>
    </AppCard>
  );
}