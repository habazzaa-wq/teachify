"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface StudioFilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function StudioFilterChip({
  label,
  active,
  onClick,
  onRemove,
  className,
}: StudioFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        "transition-all duration-150",
        active
          ? "bg-studio-accent text-studio-accent-fg border-studio-accent"
          : "bg-studio-surface text-studio-fg border-studio-border hover:border-studio-accent-border",
        className,
      )}
    >
      {label}
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
