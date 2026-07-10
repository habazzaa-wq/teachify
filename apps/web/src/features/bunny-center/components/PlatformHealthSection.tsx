"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Activity, Gauge, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui";
import type { ServiceHealth } from "../types";

interface PlatformHealthSectionProps {
  services?: ServiceHealth[];
  loading?: boolean;
}

const statusIcon = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  unknown: Clock,
};

const statusColor = {
  healthy: "text-success",
  degraded: "text-warning",
  down: "text-destructive",
  unknown: "text-muted-foreground",
};

const statusBg = {
  healthy: "bg-success/10 border-success/20",
  degraded: "bg-warning/10 border-warning/20",
  down: "bg-destructive/10 border-destructive/20",
  unknown: "bg-muted border-border",
};

const statusLabel = {
  healthy: "سليم",
  degraded: "ضعيف",
  down: "معطل",
  unknown: "غير معروف",
};

const ServiceRow = memo(function ServiceRow({ service }: { service: ServiceHealth }) {
  const Icon = statusIcon[service.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:shadow-sm",
        statusBg[service.status],
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", statusColor[service.status])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{service.service}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {service.latency}ms
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {service.availability}%
            </span>
            {service.retryQueue != null && service.retryQueue > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <RefreshCw className="h-3 w-3" />
                {service.retryQueue} في قائمة الانتظار
              </span>
            )}
          </div>
        </div>
      </div>
      <span className={cn("text-xs font-medium", statusColor[service.status])}>
        {statusLabel[service.status]}
      </span>
    </motion.div>
  );
});

function PlatformHealthSection({ services, loading }: PlatformHealthSectionProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!services) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">صحة المنصة</h3>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">
            {services.filter((s) => s.status === "healthy").length}/{services.length} سليم
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {services.map((service) => (
          <ServiceRow key={service.service} service={service} />
        ))}
      </div>
    </div>
  );
}

export { PlatformHealthSection };
