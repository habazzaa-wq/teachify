"use client";

import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface StudioWorkspaceInspectorProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  width?: number;
}

export function StudioWorkspaceInspector({
  className,
  open = true,
  onClose,
  title,
  width = 320,
  children,
  ...props
}: StudioWorkspaceInspectorProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex h-full flex-col border-r border-studio-border bg-studio-surface overflow-hidden",
            className,
          )}
          style={{ minWidth: width }}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-studio-border px-4 py-3">
              <h3 className="text-sm font-semibold text-studio-fg">{title}</h3>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 hover:bg-studio-soft transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-auto studio-scrollbar p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
