"use client";

import {
  ExternalLink,
  Globe,
  Shield,
  Activity,
  HeartPulse,
  FileText,
} from "lucide-react";
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppBadge, AppProgress } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import {
  DOMAIN_STATUS_CONFIG,
  SSL_STATUS_CONFIG,
  DNS_STATUS_CONFIG,
} from "../../constants";
import type { PlatformDomain } from "../../types";

interface DomainSidebarProps {
  domain: PlatformDomain;
  onNavigateToTab: (tab: string) => void;
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function DomainSidebar({ domain, onNavigateToTab }: DomainSidebarProps) {
  const statusConfig = DOMAIN_STATUS_CONFIG[domain.status];
  const sslConfig = SSL_STATUS_CONFIG[domain.ssl.status];
  const dnsConfig = DNS_STATUS_CONFIG[domain.dnsStatus];

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <AppCard>
        <AppCardHeader className="pb-3">
          <AppCardTitle className="text-sm">ملخص الحالة</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="space-y-1">
          <SidebarRow label="الحالة">
            <AppBadge
              variant={statusConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {statusConfig.label}
            </AppBadge>
          </SidebarRow>

          <div className="border-b" />

          <SidebarRow label="الصحة">
            <div className="flex items-center gap-2">
              <AppProgress
                value={domain.health.overall}
                max={100}
                size="sm"
                variant={
                  domain.health.overall >= 90 ? "success" :
                  domain.health.overall >= 50 ? "warning" : "destructive"
                }
                className="w-16"
              />
              <span className={cn(
                "text-xs font-medium tabular-nums",
                domain.health.overall >= 90 && "text-success",
                domain.health.overall >= 50 && domain.health.overall < 90 && "text-warning",
                domain.health.overall < 50 && "text-destructive",
              )}>
                {domain.health.overall}
              </span>
            </div>
          </SidebarRow>

          <div className="border-b" />

          <SidebarRow label="SSL">
            <AppBadge
              variant={sslConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {sslConfig.label}
            </AppBadge>
          </SidebarRow>

          <div className="border-b" />

          <SidebarRow label="DNS">
            <AppBadge
              variant={dnsConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {dnsConfig.label}
            </AppBadge>
          </SidebarRow>

          <div className="border-b" />

          <SidebarRow label="آخر نشاط">
            <span className="text-xs text-foreground tabular-nums">
              {domain.health.lastChecked ? formatDateTime(domain.health.lastChecked) : "—"}
            </span>
          </SidebarRow>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="pb-3">
          <AppCardTitle className="text-sm">روابط سريعة</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="space-y-0.5">
          <SidebarLink
            icon={ExternalLink}
            label="فتح الموقع"
            onClick={() => window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer")}
          />
          <SidebarLink
            icon={Globe}
            label="سجلات DNS"
            onClick={() => onNavigateToTab("dns")}
          />
          <SidebarLink
            icon={Shield}
            label="شهادة SSL"
            onClick={() => onNavigateToTab("ssl")}
          />
          <SidebarLink
            icon={HeartPulse}
            label="فحوصات الصحة"
            onClick={() => onNavigateToTab("health")}
          />
          <SidebarLink
            icon={Activity}
            label="الجدول الزمني"
            onClick={() => onNavigateToTab("timeline")}
          />
          <SidebarLink
            icon={FileText}
            label="السجلات"
            onClick={() => onNavigateToTab("logs")}
          />
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { DomainSidebar };
