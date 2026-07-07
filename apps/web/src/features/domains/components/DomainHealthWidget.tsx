"use client";

import { Gauge, Wifi, Shield, Globe, Server, HeartPulse } from "lucide-react";
import { AppProgress, AppBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { HEALTH_STATUS_CONFIG } from "../constants";
import { formatDateTime } from "@/lib/format";
import type { DomainHealth } from "../types";

interface DomainHealthWidgetProps {
  health: DomainHealth;
}

function HealthBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={cn(
          "text-xs font-medium tabular-nums",
          value >= 90 && "text-success",
          value >= 50 && value < 90 && "text-warning",
          value < 50 && "text-destructive",
        )}>
          {value}%
        </span>
      </div>
      <AppProgress
        value={value}
        max={100}
        size="sm"
        variant={
          value >= 90 ? "success" :
          value >= 50 ? "warning" : "destructive"
        }
      />
    </div>
  );
}

function DomainHealthWidget({ health }: DomainHealthWidgetProps) {
  const healthConfig = HEALTH_STATUS_CONFIG[health.status];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className={cn(
            "h-5 w-5",
            health.status === "healthy" && "text-success",
            health.status === "degraded" && "text-warning",
            health.status === "unhealthy" && "text-destructive",
          )} />
          <div>
            <p className="text-sm font-semibold">صحة النطاق</p>
            {health.lastChecked && (
              <p className="text-[10px] text-muted-foreground">
                آخر فحص: {formatDateTime(health.lastChecked)}
              </p>
            )}
          </div>
        </div>
        <AppBadge
          variant={healthConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
        >
          {healthConfig.label}
        </AppBadge>
      </div>

      <div className="grid gap-4">
        <HealthBar label="زمن الاستجابة" value={Math.min(100, Math.round(100 - health.latency / 2))} icon={Gauge} />
        <HealthBar label="الاتاحة" value={health.availability} icon={Wifi} />
        <HealthBar label="SSL" value={health.ssl} icon={Shield} />
        <HealthBar label="DNS" value={health.dns} icon={Globe} />
        <HealthBar label="HTTP" value={health.http} icon={Server} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">النقاط الإجمالية</span>
          <span className={cn(
            "text-lg font-bold",
            health.overall >= 90 && "text-success",
            health.overall >= 50 && "text-warning",
            health.overall < 50 && "text-destructive",
          )}>
            {health.overall}/100
          </span>
        </div>
        <AppProgress
          value={health.overall}
          max={100}
          size="lg"
          variant={
            health.overall >= 90 ? "success" :
            health.overall >= 50 ? "warning" : "destructive"
          }
          className="mt-2"
        />
      </div>
    </div>
  );
}

export { DomainHealthWidget };
