"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { useUploadManagerStore } from "../store";

export function UploadDragOverlay() {
  const isDragActive = useUploadManagerStore((s) => s.isDragActive);

  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-studio-overlay/40 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-label="إفلات الملفات للرفع"
        >
          <motion.div
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-studio-accent bg-studio-surface px-12 py-14 text-center shadow-[0_16px_48px_-12px_hsl(var(--studio-fg)/0.25)]"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-studio-accent-soft text-studio-accent"
            >
              <UploadCloud className="h-8 w-8" />
            </motion.div>
            <div>
              <p className="text-lg font-semibold text-studio-fg">أفلت الملفات هنا</p>
              <p className="mt-1 text-sm text-studio-fg-muted">
                سيبدأ الرفع فوراً إلى مكتبة الوسائط
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
