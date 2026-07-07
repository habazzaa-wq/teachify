"use client";

import { X, Trash2, FolderInput, Tag, Download, Archive, Heart } from "lucide-react";
import { AppButton } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onMove: () => void;
  onTag: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDownload: () => void;
}

function BulkActionBar({
  selectedCount,
  onClear,
  onDelete,
  onMove,
  onTag,
  onFavorite,
  onArchive,
  onDownload,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-2xl">
            <AppButton variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
              <X className="h-4 w-4" />
            </AppButton>
            <span className="mx-2 text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? "محدد" : "محددين"}
            </span>
            <span className="h-6 w-px bg-border" />
            <AppButton variant="ghost" size="sm" onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              تحميل
            </AppButton>
            <AppButton variant="ghost" size="sm" onClick={onMove} className="gap-2">
              <FolderInput className="h-4 w-4" />
              نقل
            </AppButton>
            <AppButton variant="ghost" size="sm" onClick={onTag} className="gap-2">
              <Tag className="h-4 w-4" />
              وسوم
            </AppButton>
            <AppButton variant="ghost" size="sm" onClick={onFavorite} className="gap-2">
              <Heart className="h-4 w-4" />
              مفضلة
            </AppButton>
            <AppButton variant="ghost" size="sm" onClick={onArchive} className="gap-2">
              <Archive className="h-4 w-4" />
              أرشفة
            </AppButton>
            <span className="h-6 w-px bg-border" />
            <AppButton variant="ghost" size="sm" onClick={onDelete} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              حذف
            </AppButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { BulkActionBar };
