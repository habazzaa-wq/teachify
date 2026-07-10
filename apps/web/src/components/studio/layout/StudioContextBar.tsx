"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StudioContextBarProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  label?: string;
}

export function StudioContextBar({
  className,
  open = false,
  onClose,
  label,
  children,
  ...props
}: StudioContextBarProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "flex items-center gap-3 border-b border-studio-border bg-studio-accent-soft/50 px-4 py-2",
              className,
            )}
            {...props}
          >
            {label && (
              <span className="text-xs font-medium text-studio-accent">{label}</span>
            )}
            <div className="flex-1 flex items-center gap-2">{children}</div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 hover:bg-studio-soft transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4 text-studio-fg-muted" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
