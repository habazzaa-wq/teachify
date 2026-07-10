"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ServiceHealth } from "../types";

interface SystemStatusSectionProps {
  services?: ServiceHealth[];
  loading?: boolean;
}

const overallConfig = {
  healthy: { label: "كل الأنظمة سليمة", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  degraded: { label: "بعض الأنظمة تعاني من مشاكل", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  down: { label: "هناك أعطال في النظام", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

function SystemStatusSection({ services }: SystemStatusSectionProps) {
  const overall = useMemo(() => {
    if (!services) return overallConfig.healthy;
    if (services.some((s) => s.status === "down")) return overallConfig.down;
    if (services.some((s) => s.status === "degraded")) return overallConfig.degraded;
    return overallConfig.healthy;
  }, [services]);

  const uptime = useMemo(() => {
    if (!services || services.length === 0) return 0;
    return Math.round(services.reduce((s, sv) => s + sv.availability, 0) / services.length);
  }, [services]);

  if (!services) return null;

  const Icon = overall.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md",
        overall.bg,
        overall === overallConfig.degraded ? "border-warning/30" :
        overall === overallConfig.down ? "border-destructive/30" :
        "border-success/30",
      )}
    >
      <Icon className={cn("mb-3 h-10 w-10", overall.color)} />
      <h3 className="text-lg font-bold tracking-tight">{overall.label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        متوسط وقت التشغيل: {uptime}%
      </p>
      <div className="mt-4 flex gap-1.5">
        {services.map((sv) => (
          <div
            key={sv.service}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold",
              sv.status === "healthy" ? "bg-success/20 text-success" :
              sv.status === "degraded" ? "bg-warning/20 text-warning" :
              sv.status === "down" ? "bg-destructive/20 text-destructive" :
              "bg-muted text-muted-foreground",
            )}
            title={`${sv.service}: ${sv.status}`}
          >
            {sv.service.charAt(0)}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {services.map((sv) => (
          <div key={sv.service} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              sv.status === "healthy" ? "bg-success" :
              sv.status === "degraded" ? "bg-warning" :
              sv.status === "down" ? "bg-destructive" : "bg-muted-foreground",
            )} />
            {sv.service}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export { SystemStatusSection };
