"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, RotateCcw, Upload, Webhook, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppBadge, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { SyncJob } from "../types";

interface SyncJobsSectionProps {
  jobs?: SyncJob[];
  loading?: boolean;
}

const jobTypeConfig = {
  sync: { label: "مزامنة", icon: RefreshCw, color: "text-primary" },
  retry: { label: "إعادة محاولة", icon: RotateCcw, color: "text-warning" },
  upload: { label: "رفع", icon: Upload, color: "text-info" },
  webhook: { label: "Webhook", icon: Webhook, color: "text-violet-500" },
};

const jobStatusIcon = {
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  pending: Clock,
};

const jobStatusColor = {
  running: "text-primary",
  completed: "text-success",
  failed: "text-destructive",
  pending: "text-muted-foreground",
};

const jobStatusBg = {
  running: "bg-primary/5 border-primary/20",
  completed: "bg-success/5 border-success/20",
  failed: "bg-destructive/5 border-destructive/20",
  pending: "bg-muted/30 border-border/30",
};

const jobStatusLabel = {
  running: "قيد التشغيل",
  completed: "مكتمل",
  failed: "فشل",
  pending: "قيد الانتظار",
};

const SyncJobRow = memo(function SyncJobRow({ job }: { job: SyncJob }) {
  const typeConf = jobTypeConfig[job.type];
  const TypeIcon = typeConf.icon;
  const StatusIcon = jobStatusIcon[job.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-all duration-200",
        jobStatusBg[job.status],
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50", typeConf.color)}>
        <TypeIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{typeConf.label}</span>
          {job.tenantName && (
            <span className="text-xs text-muted-foreground">— {job.tenantName}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{formatDateTime(job.startedAt)}</span>
          {job.duration > 0 && <span>{job.duration}ث</span>}
          {job.retries > 0 && <span>محاولات: {job.retries}</span>}
          {job.error && <span className="text-destructive">{job.error}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusIcon className={cn("h-4 w-4", job.status === "running" && "animate-spin", jobStatusColor[job.status])} />
        <AppBadge variant={
          job.status === "completed" ? "success" :
          job.status === "failed" ? "destructive" :
          job.status === "running" ? "default" : "secondary"
        } className="text-[10px]">
          {jobStatusLabel[job.status]}
        </AppBadge>
      </div>
    </motion.div>
  );
});

function SyncJobsSection({ jobs, loading }: SyncJobsSectionProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!jobs) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">مهام المزامنة</h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            {jobs.filter((j) => j.status === "completed").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            {jobs.filter((j) => j.status === "failed").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {jobs.filter((j) => j.status === "running").length}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <SyncJobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export { SyncJobsSection };
