"use client";

import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppBadge, AppEmptyState } from "@/components/ui";
import { CheckCircle2, Shield, Globe, Activity, AlertTriangle, Clock } from "lucide-react";
import type { PlatformDomain } from "../../types";
import type { DomainTimelineEvent } from "../../types/detail";

interface DomainTimelineCardProps {
  domain: PlatformDomain;
}

const typeConfig = {
  created: { dot: "bg-primary", icon: CheckCircle2, label: "إنشاء" },
  dns_verified: { dot: "bg-success", icon: Globe, label: "DNS" },
  ssl_requested: { dot: "bg-warning", icon: Shield, label: "SSL" },
  ssl_issued: { dot: "bg-success", icon: Shield, label: "SSL" },
  activated: { dot: "bg-success", icon: Activity, label: "تفعيل" },
  renewed: { dot: "bg-primary", icon: Shield, label: "تجديد" },
  suspended: { dot: "bg-destructive", icon: AlertTriangle, label: "تعليق" },
  failed: { dot: "bg-destructive", icon: AlertTriangle, label: "فشل" },
  updated: { dot: "bg-primary", icon: Clock, label: "تحديث" },
};

function buildTimelineEvents(domain: PlatformDomain): DomainTimelineEvent[] {
  const events: DomainTimelineEvent[] = [];

  events.push({
    id: "created",
    type: "created",
    title: "تم إنشاء النطاق",
    description: `تمت إضافة ${domain.domain} إلى النظام`,
    timestamp: domain.createdAt,
    actor: "admin",
  });

  if (domain.status === "pending") {
    events.push({
      id: "pending",
      type: "updated",
      title: "بانتظار التحقق",
      description: "النطاق في انتظار التحقق من سجلات DNS",
      timestamp: domain.createdAt,
      actor: "system",
    });
  }

  if (domain.verifiedAt) {
    events.push({
      id: "dns-verified",
      type: "dns_verified",
      title: "تم التحقق من DNS",
      description: "تم التحقق من سجلات DNS بنجاح",
      timestamp: domain.verifiedAt,
      actor: "system",
    });
  }

  if (domain.ssl.issuedAt) {
    events.push({
      id: "ssl-issued",
      type: "ssl_issued",
      title: "تم إصدار شهادة SSL",
      description: `شهادة ${domain.ssl.provider} - تنتهي خلال ${domain.ssl.remainingDays} يوم`,
      timestamp: domain.ssl.issuedAt,
      actor: "system",
    });
  }

  if (domain.status === "active") {
    events.push({
      id: "activated",
      type: "activated",
      title: "تم تفعيل النطاق",
      description: "النطاق جاهز للاستخدام",
      timestamp: domain.updatedAt,
      actor: "system",
    });
  }

  if (domain.status === "failed") {
    events.push({
      id: "failed",
      type: "failed",
      title: "فشل التفعيل",
      description: "حدث خطأ أثناء تفعيل النطاق",
      timestamp: domain.updatedAt,
      actor: "system",
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function DomainTimelineCard({ domain }: DomainTimelineCardProps) {
  const events = buildTimelineEvents(domain);

  if (events.length === 0) {
    return (
      <AppCard>
        <AppCardContent className="py-12">
          <AppEmptyState
            title="لا توجد أحداث بعد"
            description="سيظهر الجدول الزمني لأحداث النطاق هنا."
            icon={Clock}
          />
        </AppCardContent>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppCardHeader>
        <AppCardTitle className="text-sm">الجدول الزمني</AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        <div className="relative">
          {events.map((event, index) => {
            const config = typeConfig[event.type] || typeConfig.updated;
            const Icon = config.icon;
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-background",
                    config.dot,
                  )}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  {!isLast && (
                    <div className="h-full w-px bg-border" />
                  )}
                </div>

                <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-tight">{event.title}</p>
                      {event.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  {event.actor && (
                    <AppBadge variant="outline" className="mt-1 text-[9px]">
                      {event.actor === "system" ? "النظام" : "المشرف"}
                    </AppBadge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AppCardContent>
    </AppCard>
  );
}

export { DomainTimelineCard };
