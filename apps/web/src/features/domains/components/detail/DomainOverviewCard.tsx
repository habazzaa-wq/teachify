"use client";

import { Globe, Activity, Clock, CheckCircle2, XCircle, Link2 } from "lucide-react";
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  DOMAIN_TYPE_CONFIG,
  DOMAIN_STATUS_CONFIG,
  SSL_STATUS_CONFIG,
  DNS_STATUS_CONFIG,
} from "../../constants";
import type { PlatformDomain } from "../../types";

interface DomainOverviewCardProps {
  domain: PlatformDomain;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function DomainOverviewCard({ domain }: DomainOverviewCardProps) {
  const typeConfig = DOMAIN_TYPE_CONFIG[domain.type];
  const statusConfig = DOMAIN_STATUS_CONFIG[domain.status];
  const sslConfig = SSL_STATUS_CONFIG[domain.ssl.status];
  const dnsConfig = DNS_STATUS_CONFIG[domain.dnsStatus];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AppCard>
        <AppCardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <AppCardTitle className="text-sm">معلومات عامة</AppCardTitle>
          </div>
        </AppCardHeader>
        <AppCardContent className="space-y-0">
          <DetailRow label="النطاق">
            <span className="font-mono text-sm">{domain.domain}</span>
          </DetailRow>
          <DetailRow label="العميل">
            {domain.tenantName}
          </DetailRow>
          <DetailRow label="الحالة">
            <AppBadge
              variant={statusConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {statusConfig.label}
            </AppBadge>
          </DetailRow>
          <DetailRow label="النوع">
            <AppBadge
              variant={typeConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
              className="text-[10px]"
            >
              {typeConfig.label}
            </AppBadge>
          </DetailRow>
          <DetailRow label="النطاق الأساسي">
            {domain.isPrimary ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                نعم
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                لا
              </span>
            )}
          </DetailRow>
          <DetailRow label="تاريخ الإنشاء">
            {formatDate(domain.createdAt)}
          </DetailRow>
          <DetailRow label="آخر تحديث">
            {formatDate(domain.updatedAt)}
          </DetailRow>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <AppCardTitle className="text-sm">الاتصال</AppCardTitle>
          </div>
        </AppCardHeader>
        <AppCardContent className="space-y-0">
          <DetailRow label="حالة DNS">
            <AppBadge
              variant={dnsConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {dnsConfig.label}
            </AppBadge>
          </DetailRow>
          <DetailRow label="حالة SSL">
            <AppBadge
              variant={sslConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {sslConfig.label}
            </AppBadge>
          </DetailRow>
          <DetailRow label="الصحة">
            <span className={cn(
              "text-sm font-medium",
              domain.health.overall >= 90 && "text-success",
              domain.health.overall >= 50 && domain.health.overall < 90 && "text-warning",
              domain.health.overall < 50 && "text-destructive",
            )}>
              {domain.health.overall}/100
            </span>
          </DetailRow>
          <DetailRow label="آخر فحص DNS">
            {formatDateTime(domain.health.lastChecked)}
          </DetailRow>
          <DetailRow label="آخر فحص SSL">
            {domain.ssl.issuedAt ? formatDateTime(domain.ssl.issuedAt) : "—"}
          </DetailRow>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <AppCardTitle className="text-sm">الأداء</AppCardTitle>
          </div>
        </AppCardHeader>
        <AppCardContent className="space-y-0">
          <DetailRow label="زمن الاستجابة">
            <span className={cn(
              "tabular-nums",
              domain.health.latency > 0 && domain.health.latency < 200 && "text-success",
              domain.health.latency >= 200 && domain.health.latency < 500 && "text-warning",
              domain.health.latency >= 500 && "text-destructive",
            )}>
              {domain.health.latency > 0 ? `${domain.health.latency} مللي ثانية` : "—"}
            </span>
          </DetailRow>
          <DetailRow label="HTTPS">
            <span className="flex items-center gap-1">
              {domain.ssl.status === "active" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  مفعّل
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  غير مفعّل
                </>
              )}
            </span>
          </DetailRow>
          <DetailRow label="الاتاحة">
            <span className={cn(
              "tabular-nums",
              domain.health.availability >= 99 && "text-success",
              domain.health.availability >= 95 && domain.health.availability < 99 && "text-warning",
              domain.health.availability < 95 && "text-destructive",
            )}>
              {domain.health.availability > 0 ? `${domain.health.availability}%` : "—"}
            </span>
          </DetailRow>
          <DetailRow label="解析 المستأجر">
            <span className="flex items-center gap-1">
              {domain.status === "active" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  نشط
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {domain.status === "pending" ? "بانتظار" : "غير متاح"}
                </>
              )}
            </span>
          </DetailRow>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { DomainOverviewCard };
