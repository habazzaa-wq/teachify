"use client";

import { useMemo } from "react";
import { HardDrive, Wifi, Eye, Activity, Video, FileText, FolderOpen, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { PlatformMetrics } from "../types";

interface BunnyCenterHeaderProps {
  metrics?: PlatformMetrics;
  loading?: boolean;
}

function MetricBlock({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-sm",
        "border-border/50",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="text-sm font-bold tabular-nums tracking-tight">
          {formatNumber(value)}
        </p>
      </div>
    </motion.div>
  );
}

const metricDefs = [
  { key: "totalStorage", label: "التخزين", icon: HardDrive, color: "bg-primary/10 text-primary" },
  { key: "totalBandwidth", label: "النطاق", icon: Wifi, color: "bg-info/10 text-info" },
  { key: "totalViews", label: "المشاهدات", icon: Eye, color: "bg-success/10 text-success" },
  { key: "totalRequests", label: "الطلبات", icon: Activity, color: "bg-warning/10 text-warning" },
  { key: "totalVideos", label: "الفيديوهات", icon: Video, color: "bg-destructive/10 text-destructive" },
  { key: "totalFiles", label: "الملفات", icon: FileText, color: "bg-cyan-500/10 text-cyan-500" },
  { key: "totalCollections", label: "المجموعات", icon: FolderOpen, color: "bg-violet-500/10 text-violet-500" },
  { key: "totalTenants", label: "المؤسسات", icon: Building2, color: "bg-amber-500/10 text-amber-500" },
];

function BunnyCenterHeaderSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mb-2 h-4 w-96 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function BunnyCenterHeader({ metrics, loading }: BunnyCenterHeaderProps) {
  const headerItems = useMemo(() => {
    if (!metrics) return [];
    return metricDefs.map((def) => ({
      ...def,
      value: metrics[def.key as keyof PlatformMetrics] ?? 0,
    }));
  }, [metrics]);

  if (loading) return <BunnyCenterHeaderSkeleton />;

  return (
    <div className="mb-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-3xl font-bold tracking-tight">مركز Bunny التحليلي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          لوحة تحكم شاملة لإدارة وتحليل استخدام منصة Bunny — التخزين، النطاق الترددي، المشاهدات، والمزيد
        </p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {headerItems.map((item) => (
          <MetricBlock key={item.key} label={item.label} value={item.value} icon={item.icon} color={item.color} />
        ))}
      </div>
    </div>
  );
}

export { BunnyCenterHeader };
