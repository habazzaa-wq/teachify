"use client";

import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppBadge, AppProgress } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { PlatformDomain } from "../../types";
import type { DomainHealthCheck } from "../../types/detail";

interface DomainHealthCardProps {
  domain: PlatformDomain;
}

const statusIcon = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
  unknown: HelpCircle,
};

const statusConfig = {
  healthy: { label: "سليم", variant: "success" as const, color: "text-success" },
  warning: { label: "تحذير", variant: "warning" as const, color: "text-warning" },
  critical: { label: "حرج", variant: "destructive" as const, color: "text-destructive" },
  unknown: { label: "غير معروف", variant: "outline" as const, color: "text-muted-foreground" },
};

function getHealthChecks(domain: PlatformDomain): DomainHealthCheck[] {
  return [
    {
      id: "dns",
      name: "DNS",
      status: domain.dnsStatus === "verified" ? "healthy" : domain.dnsStatus === "failed" ? "critical" : domain.dnsStatus === "pending" ? "warning" : "unknown",
      message: domain.dnsStatus === "verified" ? "سجلات DNS صحيحة" : domain.dnsStatus === "failed" ? "سجلات DNS غير صحيحة" : "بانتظار التحقق",
      lastChecked: domain.health.lastChecked,
      value: domain.dnsStatus,
    },
    {
      id: "https",
      name: "HTTPS",
      status: domain.ssl.status === "active" ? "healthy" : domain.ssl.status === "error" || domain.ssl.status === "expired" ? "critical" : domain.ssl.status === "pending" ? "warning" : "unknown",
      message: domain.ssl.status === "active" ? "الاتصال آمن عبر HTTPS" : "الاتصال غير آمن",
      lastChecked: domain.health.lastChecked,
      value: domain.ssl.status,
    },
    {
      id: "tenant-resolution",
      name: "解析 المستأجر",
      status: domain.status === "active" ? "healthy" : domain.status === "failed" ? "critical" : domain.status === "pending" ? "warning" : "unknown",
      message: domain.status === "active" ? "المستأجر يُحل بنجاح" : "تعذر حل المستأجر",
      lastChecked: domain.health.lastChecked,
    },
    {
      id: "certificate",
      name: "الشهادة",
      status: domain.ssl.status === "active" && domain.ssl.remainingDays > 30 ? "healthy" : domain.ssl.status === "active" && domain.ssl.remainingDays <= 30 ? "warning" : domain.ssl.status === "expired" ? "critical" : "unknown",
      message: domain.ssl.status === "active" ? `${domain.ssl.remainingDays} يوم متبقي` : "لا توجد شهادة صالحة",
      lastChecked: domain.health.lastChecked,
      value: domain.ssl.remainingDays > 0 ? `${domain.ssl.remainingDays} يوم` : undefined,
    },
    {
      id: "scheduler",
      name: "المجدول",
      status: domain.status === "active" ? "healthy" : "unknown",
      message: domain.status === "active" ? "المجدول يعمل بشكل طبيعي" : "غير متاح",
      lastChecked: null,
    },
    {
      id: "queue",
      name: "القائمة",
      status: "unknown",
      message: "متاح فقط للنطاقات النشطة",
      lastChecked: null,
    },
  ];
}

function HealthCheckRow({ check }: { check: DomainHealthCheck }) {
  const Icon = statusIcon[check.status];
  const config = statusConfig[check.status];

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{check.name}</span>
          <AppBadge variant={config.variant} className="text-[10px]">
            {config.label}
          </AppBadge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
      </div>
      <div className="text-left shrink-0">
        {check.value && (
          <span className="text-xs font-mono text-muted-foreground">{check.value}</span>
        )}
        {check.lastChecked && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">
            {formatDateTime(check.lastChecked)}
          </p>
        )}
      </div>
    </div>
  );
}

function DomainHealthCard({ domain }: DomainHealthCardProps) {
  const checks = getHealthChecks(domain);
  const healthyCount = checks.filter((c) => c.status === "healthy").length;
  const totalCount = checks.length;

  return (
    <div className="space-y-4">
      <AppCard>
        <AppCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className={cn(
                "h-5 w-5",
                domain.health.status === "healthy" && "text-success",
                domain.health.status === "degraded" && "text-warning",
                domain.health.status === "unhealthy" && "text-destructive",
              )} />
              <AppCardTitle className="text-sm">النقاط الإجمالية</AppCardTitle>
            </div>
            <AppBadge
              variant={
                domain.health.overall >= 90 ? "success" :
                domain.health.overall >= 50 ? "warning" : "destructive"
              }
            >
              {domain.health.overall}/100
            </AppBadge>
          </div>
        </AppCardHeader>
        <AppCardContent>
          <AppProgress
            value={domain.health.overall}
            max={100}
            size="lg"
            variant={
              domain.health.overall >= 90 ? "success" :
              domain.health.overall >= 50 ? "warning" : "destructive"
            }
            animated
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {healthyCount} من {totalCount} فحوصات تعمل بشكل طبيعي
          </p>
        </AppCardContent>
      </AppCard>

      <div className="space-y-2">
        {checks.map((check) => (
          <HealthCheckRow key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}

export { DomainHealthCard };
