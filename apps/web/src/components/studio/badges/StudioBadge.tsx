"use client";

import { cn } from "@/lib/cn";

export type BadgeTone = "default" | "accent" | "success" | "warning" | "danger" | "info" | "premium";
export type BadgeStatus = "published" | "draft" | "archived" | "locked" | "private" | "featured" | "premium" | "new";

export interface StudioBadgeProps {
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  default: "bg-studio-soft text-studio-fg-muted border-studio-border",
  accent: "bg-studio-accent text-studio-accent-fg border-studio-accent",
  success: "bg-studio-success/10 text-studio-success border-studio-success/20",
  warning: "bg-studio-warning/10 text-studio-warning border-studio-warning/20",
  danger: "bg-studio-danger/10 text-studio-danger border-studio-danger/20",
  info: "bg-studio-info/10 text-studio-info border-studio-info/20",
  premium: "bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px] font-semibold gap-1",
  md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
};

export function StudioBadge({
  tone = "default",
  size = "sm",
  icon,
  children,
  className,
}: StudioBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border leading-none uppercase tracking-wider",
        toneStyles[tone],
        sizeStyles[size],
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
