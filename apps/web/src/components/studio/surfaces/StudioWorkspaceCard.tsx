"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface StudioWorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function StudioWorkspaceCard({
  className,
  active,
  children,
  ...props
}: StudioWorkspaceCardProps) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border bg-studio-surface transition-all duration-150",
        active
          ? "border-studio-accent ring-1 ring-studio-accent/20"
          : "border-studio-border hover:border-studio-accent-border",
        className,
      )}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}
