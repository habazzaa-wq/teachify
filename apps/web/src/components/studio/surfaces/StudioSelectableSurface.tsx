"use client";

import { cn } from "@/lib/cn";

interface StudioSelectableSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export function StudioSelectableSurface({
  className,
  selected,
  disabled,
  onSelect,
  children,
  ...props
}: StudioSelectableSurfaceProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "rounded-xl border bg-studio-surface p-4 cursor-pointer",
        "transition-all duration-150",
        selected
          ? "border-studio-accent ring-1 ring-studio-accent/20 bg-studio-accent-soft/30"
          : "border-studio-border hover:border-studio-accent-border hover:bg-studio-soft/30",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
