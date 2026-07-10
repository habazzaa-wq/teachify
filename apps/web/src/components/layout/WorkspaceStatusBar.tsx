"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff, Layers, Activity, Keyboard } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { cn } from "@/lib/cn";

const statusBarMotion = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.1 },
};

export function WorkspaceStatusBar() {
  const {
    workspaceStatus,
    syncProgress,
    backgroundTaskCount,
  } = useWorkspaceStore();

  const isOnline = workspaceStatus === "online";
  const isSyncing = workspaceStatus === "syncing";

  return (
    <motion.footer
      {...statusBarMotion}
      className="flex h-8 shrink-0 items-center justify-between border-t border-studio-border bg-studio-surface px-4 text-[11px] text-studio-fg-muted"
      role="status"
      aria-label="شريط الحالة"
    >
      {/* Left: Status & Network */}
      <div className="flex items-center gap-3">
        {/* Workspace Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "relative flex h-2 w-2",
              isSyncing && "animate-pulse",
            )}
          >
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full",
                isOnline && "bg-studio-success",
                isSyncing && "bg-studio-warning",
                !isOnline && "bg-studio-danger",
              )}
            />
          </span>
          <span>
            {isSyncing ? "مزامنة..." : isOnline ? "متصل" : "غير متصل"}
          </span>
        </div>

        {/* Network indicator */}
        <div className="hidden items-center gap-1 md:flex">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-studio-success" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3 w-3 text-studio-danger" aria-hidden="true" />
          )}
          <span className="text-studio-fg-subtle">شبكة</span>
        </div>

        {/* Sync progress */}
        {syncProgress > 0 && syncProgress < 100 && (
          <div className="hidden items-center gap-1.5 md:flex">
            <Activity className="h-3 w-3 text-studio-accent" aria-hidden="true" />
            <span className="text-studio-fg-subtle">{syncProgress}%</span>
          </div>
        )}
      </div>

      {/* Right: Tasks & Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Background tasks */}
        {backgroundTaskCount > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            <Layers className="h-3 w-3" aria-hidden="true" />
            <span>{backgroundTaskCount} مهمة</span>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <div className="hidden items-center gap-1 md:flex">
          <Keyboard className="h-3 w-3 text-studio-fg-subtle" aria-hidden="true" />
          <kbd className="rounded border border-studio-border bg-studio-soft px-1 text-[10px] text-studio-fg-subtle">
            ⌘K
          </kbd>
          <span className="text-studio-fg-subtle">بحث</span>
        </div>

        {/* Responsive: smaller hint */}
        <div className="flex items-center gap-1 md:hidden">
          <kbd className="rounded border border-studio-border bg-studio-soft px-1 text-[10px] text-studio-fg-subtle">
            ⌘K
          </kbd>
        </div>
      </div>
    </motion.footer>
  );
}
