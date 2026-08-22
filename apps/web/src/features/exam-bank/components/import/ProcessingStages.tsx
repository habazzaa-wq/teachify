"use client";

import { Check, Loader2, MinusCircle, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ImportStage } from "../../services/import-types";

/**
 * Real-time pipeline stage list — mirrors exactly what the backend reports.
 * Nothing here is simulated: pending stages stay gray until the API says
 * they started, running stages spin until the API says done/skipped.
 */
export function ProcessingStages({
  stages,
  className,
}: {
  stages: ImportStage[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)} aria-live="polite">
      {stages.map((stage) => (
        <li
          key={stage.key}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
            stage.status === "running" && "border-studio-accent-border bg-studio-accent/5",
            stage.status === "done" && "border-studio-success/40 bg-emerald-500/5",
            stage.status === "skipped" && "border-amber-400/50 bg-amber-50/40",
            stage.status === "pending" && "border-studio-border bg-studio-surface opacity-70",
          )}
        >
          <StageIcon status={stage.status} />
          <span
            className={cn(
              "font-medium",
              stage.status === "pending" ? "text-studio-fg-muted" : "text-studio-fg",
            )}
          >
            {stage.label}
          </span>
          {stage.detail && (
            <span dir="auto" className="truncate text-xs text-studio-fg-muted">
              — {stage.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function StageIcon({ status }: { status: ImportStage["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-studio-accent text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
        <MinusCircle className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="text-studio-fg-subtle flex h-6 w-6 shrink-0 items-center justify-center">
      <Circle className="h-4 w-4" />
    </span>
  );
}
