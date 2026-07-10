"use client";

import { cn } from "@/lib/cn";

export interface StudioWorkspaceHeaderProps extends React.HTMLAttributes<HTMLElement> {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  variant?: "default" | "glass";
  sticky?: boolean;
}

export function StudioWorkspaceHeader({
  className,
  left,
  center,
  right,
  variant = "glass",
  sticky = true,
  ...props
}: StudioWorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between px-6 gap-4 z-30",
        variant === "glass" && "studio-glass-toolbar",
        variant === "default" && "border-b border-studio-border bg-studio-surface",
        sticky && "sticky top-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 flex-1">{left}</div>
      {center && <div className="flex items-center gap-3">{center}</div>}
      <div className="flex items-center gap-3 flex-1 justify-end">{right}</div>
    </header>
  );
}
