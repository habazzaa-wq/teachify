"use client";

import { Loader2 } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DomainStatus, DnsStatus, SslStatus, HealthStatus } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeType = "status" | "dns" | "ssl" | "health";

interface DomainStatusBadgeProps {
  type: BadgeType;
  value: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<DomainStatus, { label: string; dot: string; variant: "success" | "warning" | "destructive" | "secondary" | "outline" }> = {
  active:  { label: "نشط",        dot: "bg-emerald-500",  variant: "success" },
  pending: { label: "بانتظار DNS", dot: "bg-amber-500",    variant: "warning" },
  failed:  { label: "خطأ",        dot: "bg-destructive",  variant: "destructive" },
  removed: { label: "موقوف",      dot: "bg-zinc-900 dark:bg-zinc-400", variant: "secondary" },
};

const DNS_MAP: Record<DnsStatus, { label: string; icon: "check" | "cross" | "spinner"; variant: "success" | "destructive" | "warning" | "secondary" }> = {
  verified:     { label: "صحيح",       icon: "check",   variant: "success" },
  pending:      { label: "قيد التحقق", icon: "spinner", variant: "warning" },
  failed:       { label: "غير صحيح",   icon: "cross",   variant: "destructive" },
  unconfigured: { label: "غير مهيأ",   icon: "cross",   variant: "secondary" },
};

const SSL_MAP: Record<SslStatus, { label: string; dot: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  active:  { label: "صالح",       dot: "bg-emerald-500", variant: "success" },
  pending: { label: "قيد الإصدار", dot: "bg-amber-500",   variant: "warning" },
  expired: { label: "منتهي",      dot: "bg-destructive",  variant: "destructive" },
  error:   { label: "خطأ",        dot: "bg-destructive",  variant: "destructive" },
  none:    { label: "غير مثبت",   dot: "bg-muted-foreground/50", variant: "outline" },
};

const HEALTH_MAP: Record<HealthStatus, { label: string; dot: string; variant: "success" | "warning" | "destructive" | "outline" }> = {
  healthy:   { label: "سليم",     dot: "bg-emerald-500", variant: "success" },
  degraded:  { label: "تحذير",    dot: "bg-amber-500",   variant: "warning" },
  unhealthy: { label: "حرج",      dot: "bg-destructive",  variant: "destructive" },
  unknown:   { label: "غير معروف", dot: "bg-muted-foreground/50", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DomainStatusBadge({ type, value, className }: DomainStatusBadgeProps) {
  if (type === "status") {
    const config = STATUS_MAP[value as DomainStatus] ?? STATUS_MAP.pending;
    return (
      <AppBadge variant={config.variant} className={cn("gap-1.5 text-[10px] font-medium", className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        {config.label}
      </AppBadge>
    );
  }

  if (type === "dns") {
    const config = DNS_MAP[value as DnsStatus] ?? DNS_MAP.pending;
    return (
      <AppBadge variant={config.variant} className={cn("gap-1.5 text-[10px] font-medium", className)}>
        {config.icon === "check" && (
          <span className="text-emerald-500 leading-none">&#10003;</span>
        )}
        {config.icon === "cross" && (
          <span className="text-destructive leading-none">&#10007;</span>
        )}
        {config.icon === "spinner" && (
          <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
        )}
        {config.label}
      </AppBadge>
    );
  }

  if (type === "ssl") {
    const config = SSL_MAP[value as SslStatus] ?? SSL_MAP.none;
    return (
      <AppBadge variant={config.variant} className={cn("gap-1.5 text-[10px] font-medium", className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        {config.label}
      </AppBadge>
    );
  }

  if (type === "health") {
    const config = HEALTH_MAP[value as HealthStatus] ?? HEALTH_MAP.unknown;
    return (
      <AppBadge variant={config.variant} className={cn("gap-1.5 text-[10px] font-medium", className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        {config.label}
      </AppBadge>
    );
  }

  return null;
}

export { DomainStatusBadge, type DomainStatusBadgeProps, type BadgeType };
