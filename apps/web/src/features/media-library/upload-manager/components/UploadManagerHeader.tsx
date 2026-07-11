"use client";

import { useState } from "react";
import { Upload, FolderUp, ChevronDown, HardDrive } from "lucide-react";
import { cn } from "@/lib/cn";
import { StudioButton } from "@/components/studio";
import { useMediaStorage } from "../../hooks";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { formatBytes } from "../utils/format";
import { ConnectionQualityIndicator } from "./ConnectionQualityIndicator";
import type { UploadManagerStats } from "../types";

interface UploadManagerHeaderProps {
  stats: UploadManagerStats;
  onToggle: () => void;
  onUploadFiles: () => void;
  onUploadFolder: () => void;
}

export function UploadManagerHeader({
  stats,
  onToggle,
  onUploadFiles,
  onUploadFolder,
}: UploadManagerHeaderProps) {
  const { data: storage } = useMediaStorage();
  const net = useNetworkStatus();
  const [storageOpen, setStorageOpen] = useState(false);

  const percent = storage ? Math.min(100, Math.round(storage.usage_percent)) : 0;
  const activeLabel = stats.active > 0 ? `${stats.active} نشط` : `${stats.total} ملف`;

  return (
    <div className="border-b border-studio-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-studio-accent-soft text-studio-accent">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-studio-fg">مدير الرفع</h2>
            <span className="rounded-full bg-studio-soft px-2 py-0.5 text-[10px] font-semibold text-studio-fg-muted">
              {activeLabel}
            </span>
            <ConnectionQualityIndicator quality={net.quality} />
          </div>
          {storage && (
            <button
              type="button"
              onClick={() => setStorageOpen((v) => !v)}
              className="mt-0.5 flex items-center gap-1 text-[10px] text-studio-fg-muted hover:text-studio-fg"
            >
              <HardDrive className="h-3 w-3" />
              <span>{formatBytes(storage.used)} / {formatBytes(storage.total)}</span>
              <span className="text-studio-fg-subtle">({percent}%)</span>
            </button>
          )}
        </div>

        <StudioButton variant="soft" size="sm" onClick={onUploadFiles} aria-label="رفع ملفات">
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">رفع</span>
        </StudioButton>
        <StudioButton variant="secondary" size="sm" onClick={onUploadFolder} aria-label="رفع مجلد">
          <FolderUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">مجلد</span>
        </StudioButton>
        <button
          type="button"
          onClick={onToggle}
          aria-label="طي المدير"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-studio-border text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {storage && storageOpen && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-studio-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                percent > 90 ? "bg-studio-danger" : percent > 70 ? "bg-studio-warning" : "bg-studio-accent",
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
