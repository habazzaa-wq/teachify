"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { X, Calendar, RefreshCw, Upload, Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber, initialsOf } from "@/lib/format";
import { AppBadge, AppAvatar, AppAvatarFallback } from "@/components/ui";
import { Sparkline } from "@/components/dashboard";
import type { BunnyTenantUsage } from "../types";

interface TenantInspectorPanelProps {
  tenant: BunnyTenantUsage & {
    topFiles?: { name: string; size: number; type: string }[];
    topVideos?: { name: string; views: number; duration: string }[];
  };
  onClose: () => void;
  usageData: { label: string; value: number; total: number; unit: string; color: string }[];
}

const UsageRing = memo(function UsageRing({ value, total, label, color, unit }: { value: number; total: number; label: string; color: string; unit: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.3" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums">{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs tabular-nums font-medium">{formatNumber(value)}{unit} / {formatNumber(total)}{unit}</span>
    </div>
  );
});

function getTimeAgo(ts: string): string {
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function TenantInspectorPanel({ tenant, onClose, usageData }: TenantInspectorPanelProps) {

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg"
    >
      <div className="flex h-full w-[380px] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AppAvatar className="h-8 w-8 rounded-lg shrink-0">
              <AppAvatarFallback className="text-[10px] font-semibold">
                {initialsOf(tenant.tenantName)}
              </AppAvatarFallback>
            </AppAvatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{tenant.tenantName}</p>
              <p className="text-[11px] text-muted-foreground">{tenant.plan}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Usage rings */}
          <div className="grid grid-cols-3 gap-2 border-b p-4">
            {usageData.map((d) => (
              <UsageRing key={d.label} {...d} />
            ))}
          </div>

          {/* Quick info */}
          <div className="space-y-1 border-b px-4 py-3">
            <InfoRow icon={Activity} label="آخر نشاط" value={getTimeAgo(tenant.lastActivity)} />
            <InfoRow icon={RefreshCw} label="آخر مزامنة" value={getTimeAgo(tenant.lastSync)} />
            <InfoRow icon={Upload} label="آخر رفع" value={getTimeAgo(tenant.lastUpload)} />
            <InfoRow icon={Calendar} label="الحالة" value={<AppBadge variant={tenant.health === "healthy" ? "success" : tenant.health === "warning" ? "warning" : "destructive"} className="text-[10px]">{healthLabel(tenant.health)}</AppBadge>} />
          </div>

          {/* Sparkline history */}
          <div className="border-b px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">سجل الاستخدام</p>
            <div className="flex items-center gap-4">
              <Sparkline data={tenant.sparkline ?? []} color="hsl(var(--primary))" height={32} width={64} />
              <span className="text-xs text-muted-foreground">آخر 12 شهر</span>
            </div>
          </div>

          {/* Remaining quota */}
          <div className="space-y-2 border-b px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">المتبقي</p>
            <div className="space-y-1.5 text-xs">
              <RemainingRow label="مساحة التخزين" value={tenant.remainingStorage} unit="GB" />
              <RemainingRow label="النطاق الترددي" value={tenant.remainingBandwidth} unit="GB" />
              <RemainingRow label="المشاهدات" value={tenant.remainingViews} unit="" />
            </div>
          </div>

          {/* Recent uploads */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">أحدث الملفات</p>
            {tenant.topFiles && tenant.topFiles.length > 0 ? (
              <div className="space-y-1">
                {tenant.topFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5">
                    <span className="text-xs truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{f.size} GB</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">لا توجد ملفات حديثة</p>
            )}
          </div>

          {/* Top videos */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">أفضل الفيديوهات</p>
            {tenant.topVideos && tenant.topVideos.length > 0 ? (
              <div className="space-y-1">
                {tenant.topVideos.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5">
                    <span className="text-xs truncate flex-1">{v.name}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{formatNumber(v.views)} مشاهدة</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">لا توجد فيديوهات</p>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className="text-xs tabular-nums font-medium">{value}</span>
    </div>
  );
}

function RemainingRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  const color = value <= 0 ? "text-destructive" : value < 10 ? "text-warning" : "text-success";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs tabular-nums font-medium", color)}>
        {formatNumber(value)} {unit}
      </span>
    </div>
  );
}

function healthLabel(h: string): string {
  switch (h) {
    case "healthy": return "سليم";
    case "warning": return "تحذير";
    case "critical": return "حرج";
    default: return h;
  }
}

export { TenantInspectorPanel };
