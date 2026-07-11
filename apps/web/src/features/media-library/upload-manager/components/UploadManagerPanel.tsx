"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Inbox, WifiOff } from "lucide-react";
import { useUploadManagerStats, useUploadManagerItems, useUploadManager, useNow, useNetworkStatus } from "../hooks";
import { useVirtualQueue } from "../utils/virtual";
import { UploadManagerHeader } from "./UploadManagerHeader";
import { UploadBulkActions } from "./UploadBulkActions";
import { UploadCard } from "./UploadCard";
import { UPLOAD_QUEUE_ROW_HEIGHT, UPLOAD_QUEUE_OVERSCAN } from "../constants";
import type { UploadItem } from "../types";

interface UploadManagerPanelProps {
  onToggle: () => void;
  onUploadFiles: () => void;
  onUploadFolder: () => void;
}

export function UploadManagerPanel({
  onToggle,
  onUploadFiles,
  onUploadFolder,
}: UploadManagerPanelProps) {
  const stats = useUploadManagerStats();
  const items = useUploadManagerItems();
  const { canUpload } = useUploadManager();
  const net = useNetworkStatus();
  const now = useNow(1000);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, offsetY, totalHeight, onScroll } = useVirtualQueue(
    items.length,
    UPLOAD_QUEUE_ROW_HEIGHT,
    UPLOAD_QUEUE_OVERSCAN,
    scrollRef,
  );

  const visible = items.slice(startIndex, endIndex + 1);

  return (
    <motion.div
      role="region"
      aria-label="مدير رفع الملفات"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="studio-glass-floating flex max-h-[70vh] w-[min(92vw,26rem)] flex-col overflow-hidden rounded-2xl border border-studio-border shadow-floating max-md:w-full max-md:max-h-[85vh] max-md:rounded-b-none"
    >
      <UploadManagerHeader
        stats={stats}
        onToggle={onToggle}
        onUploadFiles={onUploadFiles}
        onUploadFolder={onUploadFolder}
      />

      {!net.online && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 border-b border-studio-border bg-studio-danger/10 px-3 py-2 text-[11px] text-studio-danger"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>غير متصل بالإنترنت — تم إيقاف الرفع مؤقتاً وسيستمّ تلقائياً عند العودة.</span>
        </div>
      )}

      <UploadBulkActions stats={stats} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-studio-soft text-studio-fg-muted">
            {canUpload ? <UploadCloud className="h-6 w-6" /> : <Inbox className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-studio-fg">لا توجد عمليات رفع</p>
            <p className="mt-1 text-xs text-studio-fg-muted">
              {canUpload
                ? "اسحب الملفات وأفلتها هنا، أو استخدم Ctrl+U"
                : "ليس لديك صلاحية رفع الملفات"}
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="studio-scrollbar min-h-[120px] flex-1 overflow-y-auto"
          style={{ maxHeight: "min(52vh, 420px)" }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            <div style={{ transform: `translateY(${offsetY}px)`, position: "absolute", insetInline: 0, top: 0 }}>
              {visible.map((item: UploadItem) => (
                <UploadCard key={item.id} id={item.id} now={now} />
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
