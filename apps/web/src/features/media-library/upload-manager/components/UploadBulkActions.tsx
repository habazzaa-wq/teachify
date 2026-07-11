"use client";

import { Pause, Play, X, RotateCw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUploadManager } from "../hooks";
import type { UploadManagerStats } from "../types";

interface UploadBulkActionsProps {
  stats: UploadManagerStats;
}

function BulkButton({
  label,
  onClick,
  disabled,
  icon,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1 focus-visible:ring-offset-studio-surface",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "border-studio-border text-studio-fg-muted hover:border-studio-danger/40 hover:bg-studio-danger/10 hover:text-studio-danger"
          : "border-studio-border text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function UploadBulkActions({ stats }: UploadBulkActionsProps) {
  const { pauseAll, resumeAll, cancelAll, retryFailed, clearCompleted, clearFailed } = useUploadManager();

  const canPauseAll = stats.active > 0 || stats.queued > 0;
  const canResumeAll = stats.paused > 0;
  const canCancelAll = stats.active > 0 || stats.queued > 0 || stats.paused > 0;
  const canRetryFailed = stats.failed > 0;
  const canClearCompleted = stats.completed > 0;
  const canClearFailed = stats.failed > 0;

  if (stats.total === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border-b border-studio-border px-3 py-2"
      role="toolbar"
      aria-label="إجراءات الرفع الجماعية"
    >
      <BulkButton label="إيقاف الكل" icon={<Pause className="h-3.5 w-3.5" />} onClick={pauseAll} disabled={!canPauseAll} />
      <BulkButton label="استئناف الكل" icon={<Play className="h-3.5 w-3.5" />} onClick={resumeAll} disabled={!canResumeAll} />
      <BulkButton label="إلغاء الكل" icon={<X className="h-3.5 w-3.5" />} onClick={cancelAll} disabled={!canCancelAll} tone="danger" />
      <span className="mx-0.5 hidden h-5 w-px bg-studio-border sm:block" />
      <BulkButton label="إعادة الفاشل" icon={<RotateCw className="h-3.5 w-3.5" />} onClick={retryFailed} disabled={!canRetryFailed} />
      <BulkButton label="مسح المكتمل" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={clearCompleted} disabled={!canClearCompleted} />
      <BulkButton label="مسح الفاشل" icon={<XCircle className="h-3.5 w-3.5" />} onClick={clearFailed} disabled={!canClearFailed} tone="danger" />
    </div>
  );
}
