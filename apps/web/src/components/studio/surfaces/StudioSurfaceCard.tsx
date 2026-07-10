"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface StudioSurfaceCardProps {
  variant?: "default" | "elevated" | "outline" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  id?: string;
  role?: string;
  tabIndex?: number;
  "aria-selected"?: boolean;
  "aria-label"?: string;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const variantStyles = {
  default: "bg-studio-surface border border-studio-border",
  elevated:
    "bg-studio-surface border border-studio-border shadow-md hover:shadow-lg transition-shadow duration-200",
  outline: "border border-studio-border bg-transparent",
  ghost: "bg-studio-soft/50",
};

export function StudioSurfaceCard({
  className,
  variant = "default",
  padding = "md",
  hoverable,
  children,
  ...props
}: StudioSurfaceCardProps) {
  const cls = cn(
    "rounded-xl transition-colors duration-150",
    variantStyles[variant],
    paddingMap[padding],
    hoverable && "cursor-pointer hover:border-studio-accent-border",
    className,
  );

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cls}
        onClick={props.onClick}
        onKeyDown={props.onKeyDown}
        style={props.style}
        id={props.id}
        role={props.role}
        tabIndex={props.tabIndex}
        aria-selected={props["aria-selected"]}
        aria-label={props["aria-label"]}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cls}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
      style={props.style}
      id={props.id}
      role={props.role}
      tabIndex={props.tabIndex}
      aria-selected={props["aria-selected"]}
      aria-label={props["aria-label"]}
    >
      {children}
    </div>
  );
}
