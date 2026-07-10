"use client";

import { cn } from "@/lib/cn";

export interface StudioListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
  visual?: React.ReactNode;
  actions?: React.ReactNode;
}

const paddingMap = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

export function StudioListRow({
  className,
  selected,
  disabled,
  hoverable = true,
  padding = "md",
  visual,
  actions,
  children,
  ...props
}: StudioListRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b border-studio-border/50 last:border-0",
        "transition-all duration-100",
        paddingMap[padding],
        hoverable && !disabled && "hover:bg-studio-soft/50 cursor-pointer",
        selected && "bg-studio-accent-soft/30",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
      {...props}
    >
      {visual && <div className="shrink-0">{visual}</div>}
      <div className="flex-1 min-w-0">{children}</div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
