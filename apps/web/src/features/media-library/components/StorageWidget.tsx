"use client";

import { HardDrive } from "lucide-react";
import { useMediaStorage } from "../hooks";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function StorageWidget() {
  const { data: storage, isLoading } = useMediaStorage();

  if (isLoading || !storage) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const percent = storage.usage_percent ?? 0;
  const color =
    percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5" />
        <span>مساحة التخزين</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatBytes(storage.used ?? 0)}</span>
        <span>{formatBytes(storage.total ?? 0)}</span>
      </div>
    </div>
  );
}

export { StorageWidget };
