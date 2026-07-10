"use client";

import { cn } from "@/lib/cn";

export interface StudioWorkspaceToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
}

export function StudioWorkspaceToolbar({
  className,
  sticky,
  children,
  ...props
}: StudioWorkspaceToolbarProps) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 border-b border-studio-border bg-studio-surface/80 px-4 backdrop-blur-sm",
        sticky && "sticky top-16 z-20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
