"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, FolderInput, Tag, Download, Archive, Heart, Pin, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onMove: () => void;
  onTag?: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDownload: () => void;
  onPin?: () => void;
  onDuplicate?: () => void;
}

function BulkActionsBarBase({
  selectedCount,
  onClear,
  onDelete,
  onMove,
  onTag,
  onFavorite,
  onArchive,
  onDownload,
  onPin,
  onDuplicate,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-1.5 rounded-2xl border bg-background/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
            <button
              onClick={onClear}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="mx-1 text-sm font-semibold tabular-nums">
              {selectedCount}
            </span>
            <span className="me-2 text-xs text-muted-foreground">
              {selectedCount === 1 ? "محدد" : "محددين"}
            </span>

            <div className="h-5 w-px bg-border" />

            <ActionButton icon={Download} label="تحميل" onClick={onDownload} />
            <ActionButton icon={FolderInput} label="نقل" onClick={onMove} />
            {onDuplicate && <ActionButton icon={Copy} label="نسخ" onClick={onDuplicate} />}
            {onTag && <ActionButton icon={Tag} label="وسوم" onClick={onTag} />}
            <ActionButton
              icon={Heart}
              label="مفضلة"
              onClick={onFavorite}
              className="text-red-500"
            />
            {onPin && <ActionButton icon={Pin} label="تثبيت" onClick={onPin} />}
            <ActionButton icon={Archive} label="أرشفة" onClick={onArchive} />

            <div className="h-5 w-px bg-border" />

            <ActionButton icon={Trash2} label="حذف" onClick={onDelete} className="text-destructive" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors hover:bg-accent",
        className,
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export const BulkActionsBar = memo(BulkActionsBarBase);
