"use client";

import { cn } from "@/lib/cn";

export interface StudioStickyToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  offset?: number;
}

export function StudioStickyToolbar({
  className,
  offset = 0,
  children,
  ...props
}: StudioStickyToolbarProps) {
  return (
    <div
      className={cn(
        "sticky z-20 flex items-center gap-2 border-b border-studio-border bg-studio-surface/90 px-4 py-2 backdrop-blur-md",
        className,
      )}
      style={{ top: offset }}
      {...props}
    >
      {children}
    </div>
  );
}
