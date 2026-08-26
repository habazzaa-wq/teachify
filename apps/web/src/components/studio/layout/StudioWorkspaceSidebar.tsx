"use client";

import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

export interface StudioWorkspaceSidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  onToggle?: () => void;
  width?: number;
  collapsedWidth?: number;
  variant?: "default" | "glass";
}

export function StudioWorkspaceSidebar({
  className,
  collapsed,
  width = 280,
  collapsedWidth = 0,
  variant = "glass",
  children,
  ...props
}: StudioWorkspaceSidebarProps) {
  return (
    <AnimatePresence mode="popLayout">
      {!collapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: collapsedWidth, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex h-full flex-col overflow-hidden",
            variant === "glass" && "studio-glass-sidebar",
            variant === "default" && "border-l border-studio-border bg-studio-surface",
            className,
          )}
          style={{ minWidth: collapsed ? collapsedWidth : width }}
        >
          <div className="flex flex-col h-full overflow-auto studio-scrollbar">
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
