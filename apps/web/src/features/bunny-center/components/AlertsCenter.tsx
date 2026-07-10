"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppBadge, Skeleton } from "@/components/ui";
import { SEVERITY_CONFIG, ALERT_TYPES_CONFIG } from "../constants";
import type { AlertItem } from "../types";

interface AlertsCenterProps {
  alerts?: AlertItem[];
  loading?: boolean;
  onAcknowledge?: (id: string) => void;
}

const severityIcon = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

function AlertRow({ alert, onAcknowledge }: { alert: AlertItem; onAcknowledge?: (id: string) => void }) {
  const SeverityIcon = severityIcon[alert.severity];
  const sevConfig = SEVERITY_CONFIG[alert.severity];
  const typeConfig = ALERT_TYPES_CONFIG[alert.type];
  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-all duration-200",
        alert.acknowledged ? "opacity-50 border-border/30 bg-muted/30" : "bg-card border-border/50 hover:shadow-sm",
        alert.severity === "critical" && !alert.acknowledged && "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        alert.severity === "critical" ? "bg-destructive/10 text-destructive" :
        alert.severity === "warning" ? "bg-warning/10 text-warning" :
        "bg-info/10 text-info",
      )}>
        <SeverityIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{alert.message}</span>
          {alert.tenantName && (
            <span className="text-xs text-muted-foreground">— {alert.tenantName}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <AppBadge variant={sevConfig.color} className="text-[10px]">
            {sevConfig.label}
          </AppBadge>
          <span className="text-[10px] text-muted-foreground/60">{typeConfig.label}</span>
          <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
        </div>
      </div>
      {!alert.acknowledged && onAcknowledge && (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          title="تأكيد"
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function getTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function AlertsCenter({ alerts, loading, onAcknowledge }: AlertsCenterProps) {
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const visibleAlerts = showAcknowledged ? alerts : alerts?.filter((a) => !a.acknowledged);
  const unacknowledgedCount = alerts?.filter((a) => !a.acknowledged).length ?? 0;

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">مركز التنبيهات</h3>
          {unacknowledgedCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold text-destructive">
              {unacknowledgedCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAcknowledged(!showAcknowledged)}
          className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          {showAcknowledged ? "إخفاء المؤكدة" : "عرض الكل"}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleAlerts && visibleAlerts.length > 0 ? (
          <div className="space-y-2">
            {visibleAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAcknowledge={onAcknowledge} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCheck className="mb-2 h-8 w-8 text-success" />
            <p className="text-sm font-medium text-muted-foreground">لا توجد تنبيهات</p>
            <p className="text-xs text-muted-foreground/60">كل شيء يعمل بسلاسة</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { AlertsCenter };
