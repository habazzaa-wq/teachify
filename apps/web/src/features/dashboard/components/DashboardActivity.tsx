"use client";

import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppBadge,
  AppButton,
  AppEmptyState,
} from "@/components/ui";
import {
  ActivityTimeline,
  type TimelineEvent,
} from "@/components/dashboard";
import type { RecentActivityItem } from "../types";

function toTimelineEvent(item: RecentActivityItem): TimelineEvent {
  const type: TimelineEvent["type"] =
    item.type === "enrollment"
      ? "create"
      : item.type === "certificate"
        ? "info"
        : item.type === "exam"
          ? item.title === "اجتياز اختبار"
            ? "create"
            : "warning"
          : "login";

  return {
    id: item.id,
    type,
    title: item.title,
    description: item.description,
    timestamp: item.timestamp,
  };
}

interface DashboardActivityProps {
  items: RecentActivityItem[];
}

export function DashboardActivity({ items }: DashboardActivityProps) {
  const events = items.map(toTimelineEvent);

  return (
    <AppCard className="card-elevated h-full">
      <AppCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AppCardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            أحدث النشاطات
          </AppCardTitle>
          <AppBadge variant="secondary" className="text-[10px]">
            مباشر
          </AppBadge>
        </div>
      </AppCardHeader>
      <AppCardContent>
        {events.length === 0 ? (
          <AppEmptyState
            title="لا توجد نشاطات حديثة"
            description="ستظهر هنا تسجيلات الطلاب والمحاولات والمدفوعات"
            variant="compact"
          />
        ) : (
          <ActivityTimeline events={events} />
        )}
        <div className="mt-2 border-t border-border/50 pt-3">
          <AppButton variant="ghost" size="sm" className="h-7 w-full text-xs" asChild>
            <Link href="/teacher/activity-log">
              عرض سجل النشاطات بالكامل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </AppButton>
        </div>
      </AppCardContent>
    </AppCard>
  );
}