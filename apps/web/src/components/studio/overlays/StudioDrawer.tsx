"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioDrawerProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: number;
  className?: string;
}

export function StudioDrawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  width = 400,
  className,
}: StudioDrawerProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose?.();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  const isRTL = side === "right";
  const slideFrom = isRTL ? { x: "100%" } : { x: "-100%" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-studio-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={slideFrom}
            animate={{ x: 0 }}
            exit={slideFrom}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative h-full flex flex-col bg-studio-surface border-studio-border shadow-xl",
              isRTL ? "mr-auto border-r" : "ml-auto border-l",
              className,
            )}
            style={{ width, minWidth: width }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-studio-border px-6 py-4">
                <h2 className="text-lg font-semibold text-studio-fg">{title}</h2>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 hover:bg-studio-soft transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-auto studio-scrollbar p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
