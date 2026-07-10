"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";

export type ChipVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

export interface StudioChipProps {
  variant?: ChipVariant;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ChipVariant, string> = {
  default: "bg-studio-soft text-studio-fg border-studio-border",
  accent: "bg-studio-accent-soft text-studio-accent border-studio-accent-border",
  success: "bg-emerald/10 text-emerald border-emerald/20",
  warning: "bg-amber/10 text-amber border-amber/20",
  danger: "bg-red/10 text-red border-red/20",
  info: "bg-blue/10 text-blue border-blue/20",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export function StudioChip({
  variant = "default",
  size = "sm",
  removable,
  onRemove,
  icon,
  children,
  className,
}: StudioChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none",
        "transition-all duration-150",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="إزالة"
        >
          <X className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  );
}
